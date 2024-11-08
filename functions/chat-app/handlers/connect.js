// handlers/connect.js
// 연결 시 DB 조회를 통해 필요한 정보를 가져와야 함
const { formatDateTimestamp } = require("../common/utils/formatUtils");
const { invokeDisconnectHandler } = require("../common/utils/lambdaClients");
const {
  updateConnection,
  getSessionData,
} = require("../common/ddb/dynamoDbClient");
const {
  sendMessageToClient,
  sendChatHistoryToClientWithoutSave,
  sendInformToClient,
} = require("../common/utils/apiGatewayClient");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const orderId = event.queryStringParameters?.orderId;
  const existingSessionData = await getSessionData(orderId);

  console.log(`연결 성공 - ConnectionId: ${connectionId}, OrderId: ${orderId}`);
  try {
    if (!orderId || !connectionId || !existingSessionData) {
      throw new Error("!orderId || !connectionId || !existingSessionData");
    }
    let sessionStatus = existingSessionData.sessionStatus;
    let isSessionActive = true;

    // completed인 경우: 견적 발송 안내 후 세션 종료
    if (sessionStatus === "completed") {
      await sendMessageToClient(
          orderId,
          connectionId,
          "요청드린 모든 정보 제공에 협조 해주셔서 감사합니다! 담당자님의 이메일로 견적을 발송 해드리겠습니다.",
          "bot"
      );
      await invokeDisconnectHandler(orderId, connectionId);

      return {
        statusCode: 400,
        body: JSON.stringify({
          message: "견적서 발송 완료",
        }),
      };
    }
    await updateConnection(orderId, connectionId, isSessionActive);
    const { pendingFields, chatHistory, lastInteractionTimestamp } = existingSessionData;
    for (const chat of chatHistory) {
      console.log(`Sending chat history to connection ${connectionId}:`, chat);
      await sendChatHistoryToClientWithoutSave(orderId, connectionId, chat);
      console.log(`Successfully sent chat history to connection ${connectionId}`);
    }

    const formattedDateTime = formatDateTimestamp(lastInteractionTimestamp || "");
    await sendInformToClient(
        orderId,
        connectionId,
        `아직 제게 전달해주지 않으신 정보가 ${
            Object.keys(pendingFields).length
        }건 남아있습니다! ${formattedDateTime} 이후의 요청을 이어가겠습니다.`,
        "bot"
    );

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Connected - ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.error(`Error during connection process for ConnectionId: ${connectionId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
