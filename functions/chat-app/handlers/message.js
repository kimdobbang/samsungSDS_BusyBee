// handlers/message
const { sendMessageToClient, sendInformToClient } = require('../common/utils/apiGatewayClient');
const { makeApiRequest } = require('../common/utils/apiRequest');
const {
  getSessionData,
  saveChat,
  getOrderIdByConnectionId,
  updateResponsedDataAndRemovePendingFields,
  updatePendingFields,
  resetPendingFields,
} = require('../common/ddb/dynamoDbClient');
const { invokeCompletionHandler } = require('../common/utils/lambdaClients');
const {
  createChatbotRequestMessage,
  parseChatbotResponse,
  parseClientMessage,

  ClientError,
} = require('../common/utils/requestResponseHelper');

module.exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const connectionId = event.requestContext.connectionId;

  try {
    const { orderId } = await getOrderIdByConnectionId(connectionId);
    if (!orderId) {
      console.log(`OrderId not found for ConnectionId: ${connectionId}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'OrderId not found' }),
      };
    }

    // 클라이언트 메시지 파싱 및 저장
    let action, clientMessage;
    try {
      ({ action, clientMessage } = parseClientMessage(event.body));
    } catch (error) {
      if (error instanceof ClientError) {
        console.log(`Client error for ConnectionId: ${connectionId}`, error);
        await sendInformToClient(connectionId, error.message, 'bot');
        return {
          statusCode: 400,
          body: JSON.stringify({ message: error.message }),
        };
      }
      throw error;
    }

    const clientMessageData = {
      timestamp: new Date().toISOString(),
      senderType: 'customer',
      message: clientMessage,
    };
    await saveChat(orderId, clientMessageData);

    // 세션 데이터 및 pendingFields 가져오기
    console.log(`Fetching session data for OrderId: ${orderId}`);
    const sessionData = await getSessionData(orderId);
    if (!sessionData || !sessionData.pendingFields) {
      console.log(`Session data or pendingFields not found for OrderId: ${orderId}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'Session data or pendingFields not found' }),
      };
    }

    const pendingFields = sessionData.pendingFields;

    // LLM API 요청 생성
    const requestData = createChatbotRequestMessage(clientMessage, pendingFields);
    const llmApiUrl = `${process.env.LLM_API_URL}?orderId=${orderId}`;
    console.log(`Sending message to LLM API for orderId: ${orderId}, URL: ${llmApiUrl}`);
    const response = await makeApiRequest(llmApiUrl, requestData);

    // LLM 응답 파싱
    const { botResponse, intent, updatedFields, language } = parseChatbotResponse(response);

    // 봇 응답 전송
    console.log(`Intent: ${intent}, Updated Fields:`, updatedFields);

    // Intent에 따른 처리
    switch (intent) {
      case '1': // 최신 물류 정보 요청
      case '3': // 기타 요청
        console.log(`Intent ${intent} 처리 완료: 봇 응답 전송.`);
        await sendMessageToClient(connectionId, botResponse, 'bot');
        break;

      case '2': // 누락된 필드 제공
        console.log('Handling missing logistics details.');

        // 누락된 필드 업데이트
        await updatePendingFields(orderId, updatedFields);

        const updatedFieldsMessage = Object.entries(updatedFields)
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        await sendMessageToClient(
          connectionId,
          `입력한 정보가 다음과 같이 업데이트되었습니다:\n${updatedFieldsMessage}\n\n입력한 정보가 맞나요? 예/아니오로 응답해주세요.`,
          'bot',
        );
        break;

      case '4_yes': // "예" 응답
        console.log('Handling Yes response.');

        // pendingFields에서 omission 또는 unknown이 아닌 필드 확인
        const fieldsToConfirm = Object.entries(pendingFields).filter(
          ([_, value]) => value !== 'omission' && value !== 'unknown',
        );

        if (fieldsToConfirm.length > 0) {
          const confirmedFields = Object.fromEntries(fieldsToConfirm);

          // responsedData 업데이트 및 pendingFields 제거
          await updateResponsedDataAndRemovePendingFields(orderId, confirmedFields);

          await sendMessageToClient(connectionId, '정보가 성공적으로 업데이트되었습니다.', 'bot');

          // 남아 있는 필드 확인
          const sessionDataAfterUpdate = await getSessionData(orderId);
          const remainingFields = Object.entries(sessionDataAfterUpdate.pendingFields || {}).filter(
            ([_, value]) => value === 'omission' || value === 'unknown',
          );

          if (remainingFields.length === 0) {
            await sendMessageToClient(
              connectionId,
              '요청드린 모든 정보 제공에 협조해 주셔서 감사합니다! 담당자님의 이메일로 견적을 발송해드리겠습니다.',
              'bot',
            );

            // 완료 Lambda 호출
            console.log(`Invoking completion Lambda for orderId: ${orderId}`);
            await invokeCompletionHandler(orderId);
          } else {
            await sendMessageToClient(
              connectionId,
              `남아 있는 정보: ${remainingFields.map(([field]) => field).join(', ')}`,
              'bot',
            );
          }
        } else {
          console.log('No fields to confirm. Sending default response.');
          await sendMessageToClient(
            connectionId,
            '확인할 정보가 없습니다. 다른 정보를 입력해주세요.',
            'bot',
          );
        }
        break;

      case '4_no': // "아니오" 응답
        console.log('Handling No response.');

        // pendingFields에서 omission 또는 unknown이 아닌 필드 확인
        const fieldsToReset = Object.keys(pendingFields).filter(
          (key) => pendingFields[key] !== 'omission' && pendingFields[key] !== 'unknown',
        );

        if (fieldsToReset.length > 0) {
          // 확인되지 않은 필드 reset
          await resetPendingFields(orderId, fieldsToReset);

          await sendMessageToClient(connectionId, '정보를 다시 입력해주세요.', 'bot');
        } else {
          console.log('No fields to reset. Sending default response.');
          await sendMessageToClient(
            connectionId,
            '다시 입력할 정보가 없습니다. 다른 정보를 입력해주세요.',
            'bot',
          );
        }
        break;
      case '4_unknown': // "알 수 없는 응답"
        console.log('Handling Unknown response.');

        // 현재 채워진 필드 필터링
        const filledFields = Object.entries(pendingFields)
          .filter(([_, value]) => value !== 'omission' && value !== 'unknown')
          .map(([key, value]) => `${key}: ${value}`)
          .join('\n');

        if (filledFields.length > 0) {
          console.log('Already filled fields:', filledFields);

          // 채워진 필드를 사용자에게 알려주고 다시 예/아니오 요구
          await sendMessageToClient(
            connectionId,
            `현재 채워진 정보는 다음과 같습니다:\n${filledFields}\n\n입력한 정보가 맞는지 예/아니오로 응답해주세요.`,
            'bot',
          );
        } else {
          console.log('No fields filled yet. Sending default response.');
          await sendMessageToClient(
            connectionId,
            '현재 입력된 정보가 없습니다. 정보를 입력해 주시고 예/아니오로 응답해주세요.',
            'bot',
          );
        }
        break;

      default:
        console.log(`Unhandled intent ${intent}: Sending default bot message.`);
        await sendMessageToClient(connectionId, '처리할 수 없는 요청입니다.', 'bot');
        break;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Message processed for ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.error(`Error processing message for ConnectionId: ${connectionId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
