// utils/apiGatewayClient.js
// WebSocket 연결을 통해 클라이언트에게 메시지를 전송하는 유틸리티 함수

const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { saveChat } = require("../ddb/dynamoDbClient");
const { markSessionInactive } = require("../ddb/dynamoDbClient");

const apigatewayManagementApi = new ApiGatewayManagementApiClient({
  endpoint: `https://${process.env.DOMAIN_NAME}/${process.env.STAGE}`,
});

async function sendMessageToClient(orderId, connectionId, message, senderType) {
  try {
    const timestamp = new Date().toISOString();
    const chatMessage = {
      timestamp,
      senderType,
      message,
    };

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    await saveChat(orderId, chatMessage);

    await apigatewayManagementApi.send(command);

    console.log(
      `Message sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      // 연결 끊어진 경우 처리
      // $disconnect 핸들러 호출
      console.error(
        `Client disconnected - markSessionInactive orderId: ${orderId}`
      );
    } else {
      console.error(`Error sending message to orderId: ${orderId}`, error);
    }
  }
}

module.exports = { sendMessageToClient };
