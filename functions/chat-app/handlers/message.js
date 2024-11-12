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
const {
  fieldTranslation,
  formatFieldValue,
  generateMissingFieldsMessage,
} = require('../common/utils/formatUtils');
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

        // 도시 필드 키
        const cityFields = ['DepartureCity', 'ArrivalCity'];

        // unknown 값이 있는 도시 필드 확인
        const hasUnknownCity = Object.entries(updatedFields).some(
          ([key, value]) => cityFields.includes(key) && value === 'unknown',
        );

        if (hasUnknownCity) {
          console.log('Updated fields contain unsupported cities.');

          await sendMessageToClient(
            connectionId,
            '지원하지 않는 도시가 포함되어 있습니다. 다시 입력해주세요.',
            'bot',
          );
          break;
        }

        // 누락된 필드 업데이트
        await updatePendingFields(orderId, updatedFields);

        const updatedFieldsMessage = Object.entries(updatedFields)
          .map(([key, value]) => {
            const translatedKey = fieldTranslation[key] || key; // 필드명 번역
            const formattedValue = formatFieldValue(key, value); // 값 변환
            return `${translatedKey}: ${formattedValue}`;
          })
          .join('\n');

        await sendMessageToClient(
          connectionId,
          `정보를 다음과 같이 업데이트했습니다:\n${updatedFieldsMessage}\n\n입력한 정보가 정확한지 확인해주세요. 맞다면 "예", 아니라면 "아니오"로 응답해주세요.`,
          'bot',
        );
        break;

      case '4_yes': // "예" 응답
        console.log('Handling Yes response.');

        const fieldsToConfirm = Object.entries(pendingFields).filter(
          ([_, value]) => value !== 'omission' && value !== 'unknown',
        );

        if (fieldsToConfirm.length > 0) {
          const confirmedFields = Object.fromEntries(fieldsToConfirm);

          await updateResponsedDataAndRemovePendingFields(orderId, confirmedFields);

          await sendMessageToClient(connectionId, '정보가 성공적으로 업데이트되었습니다.', 'bot');

          const sessionDataAfterUpdate = await getSessionData(orderId);
          const remainingFieldsMessage = generateMissingFieldsMessage(
            sessionDataAfterUpdate.pendingFields || {},
          );

          if (!remainingFieldsMessage.includes('입력되지 않은 정보는')) {
            await sendMessageToClient(
              connectionId,
              '요청드린 모든 정보 제공에 협조해 주셔서 감사합니다! 담당자님의 이메일로 견적을 발송해드리겠습니다.',
              'bot',
            );

            console.log(`Invoking completion Lambda for orderId: ${orderId}`);
            await invokeCompletionHandler(orderId);
          } else {
            await sendMessageToClient(connectionId, remainingFieldsMessage, 'bot');
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

        const fieldsToReset = Object.keys(pendingFields).filter(
          (key) => pendingFields[key] !== 'omission' && pendingFields[key] !== 'unknown',
        );

        if (fieldsToReset.length > 0) {
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

        const filledFields = Object.entries(pendingFields)
          .filter(([_, value]) => value !== 'omission' && value !== 'unknown')
          .map(([key, value]) => {
            const translatedKey = fieldTranslation[key] || key; // 필드명 번역
            const formattedValue = formatFieldValue(key, value); // 값 변환
            return `${translatedKey}: ${formattedValue}`;
          })
          .join('\n');

        if (filledFields.length > 0) {
          console.log('Already filled fields:', filledFields);

          await sendMessageToClient(
            connectionId,
            `현재 다음 정보가 입력되었습니다:\n${filledFields}\n\n입력한 정보가 정확한지 확인해주세요. 맞다면 "예", 아니라면 "아니오"로 응답해주세요.`,
            'bot',
          );
        } else {
          console.log('No fields filled yet. Sending default response.');

          const missingFieldsMessage = generateMissingFieldsMessage(pendingFields);
          await sendMessageToClient(
            connectionId,
            missingFieldsMessage ||
              '현재 입력된 정보가 없습니다. 필요한 정보를 입력하신 후 "예" 또는 "아니오"로 응답해주세요.',
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
    try {
      await sendMessageToClient(
        connectionId,
        '요청을 처리하는 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
        'bot',
      );
    } catch (sendError) {
      console.error(
        `Failed to send error message to client for ConnectionId: ${connectionId}`,
        sendError,
      );
    }

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
