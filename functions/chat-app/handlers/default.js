// handlers/default.js
const {
  sendMessageToClient,
  sendChatHistoryToClientWithoutSave,
  sendInformToClient,
} = require('../common/utils/apiGatewayClient');
const { invokeDisconnectHandler } = require('../common/utils/lambdaClients');
const { markSessionInProgress } = require('../common/ddb/dynamoDbClient');
const { formatDateTimestamp, fieldTranslation } = require('../common/utils/formatUtils');

module.exports.handler = async (event) => {
  console.log('Received event:', JSON.stringify(event, null, 2));
  const { connectionId, sessionData } = event;
  const { orderId, sessionStatus, pendingFields, chatHistory, lastInteractionTimestamp } =
    sessionData;

  try {
    if (!connectionId || !orderId || !sessionStatus || !sessionData) {
      throw new Error('Missing required fields in the event');
    }
  } catch (error) {
    console.error('Failed to parse event:', error);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid event data' }),
    };
  }
  // 첫 접속
  try {
    const initMessage = `안녕하세요! 견적 요청을 주셔서 감사합니다. 요청주신 내용을 검토해보니, ${
      Object.keys(pendingFields).length
    }가지 정보가 누락되었습니다. 제가 추가 정보를 요청 드리겠습니다.`;

    if (sessionStatus === 'init') {
      const initMessage = `안녕하세요! 견적 요청을 주셔서 감사합니다. 요청주신 내용을 검토해보니, 아래 정보가 누락되었습니다:`;

      const missingFieldsList = Object.keys(pendingFields)
        .map((field, index) => {
          const translatedField = fieldTranslation[field] || field; // 필드명 번역
          return `${index + 1}. ${translatedField}`;
        })
        .join('\n');

      const fullMessage = `${initMessage}\n${missingFieldsList}\n이 정보를 제공해주시면 견적을 완료할 수 있습니다.`;

      await sendMessageToClient(connectionId, fullMessage, 'bot');
      await markSessionInProgress(orderId);
      console.log(`Session init & status updated to 'inProgress' for orderId: ${orderId}`);
    } else if (sessionStatus === 'inProgress') {
      for (const chat of chatHistory) {
        await sendChatHistoryToClientWithoutSave(connectionId, chat);
      }
      console.log(`채팅기록 전달완료 to connection ${connectionId}`);

      const formattedDateTime = formatDateTimestamp(lastInteractionTimestamp || '');
      const progressMessage = `아직 전달되지 않은 정보가 ${Object.keys(pendingFields).length}건 있습니다. ${formattedDateTime} 이후의 요청을 이어가겠습니다.`;

      const missingFieldsList = Object.keys(pendingFields)
        .map((field, index) => {
          const translatedField = fieldTranslation[field] || field; // 필드명 번역
          return `${index + 1}. ${translatedField}`;
        })
        .join('\n');

      const fullMessage = `${progressMessage}\n\n아직 필요한 정보는 다음과 같습니다:\n${missingFieldsList}`;

      await sendInformToClient(connectionId, fullMessage, 'bot');
      console.log(`Session inProgress & missing information sent to orderId: ${orderId}`);
    } else if (sessionStatus === 'completed') {
      await sendMessageToClient(
        connectionId,
        '요청드린 모든 정보 제공에 협조해 주셔서 감사합니다! 담당자님의 이메일로 견적을 발송해드리겠습니다.',
        'bot',
      );
      await invokeDisconnectHandler(orderId, connectionId);
      return;
    }
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Handler executed successfully for ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.log(
      `Error in $default handler during connection process for ConnectionId: ${connectionId}`,
      error,
    );

    // 사용자에게 에러 메시지 전송
    await sendMessageToClient(
      connectionId,
      '죄송합니다. 요청을 처리하는 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
      'bot',
    );

    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal Server Error' }),
    };
  }
};
