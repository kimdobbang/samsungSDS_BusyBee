// utils/apiGatewayClient.js
// WebSocket 연결을 통해 클라이언트에게 메시지를 전송하는 유틸리티 함수

const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { saveChat } = require("./dynamoDbClient"); // chatHistory를 저장하는 함수

const apigatewayManagementApi = new ApiGatewayManagementApiClient({
  endpoint: `https://${process.env.DOMAIN_NAME}/${process.env.STAGE}`,
});

function sendMessageToClient(orderId, connectionId, message, senderType) {
  try {
    const timestamp = new Date().toISOString();
    const chatMessage = {
      timestamp,
      senderType,
      message,
    };
    saveChat(orderId, chatMessage);

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    apigatewayManagementApi.send(command);
    console.log(
      `Message sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      // 연결 끊어진 경우 처리(connection id 삭제)
      deleteConnection(connectionId);
      console.error(
        `Client disconnected(410) - deleting ConnectionId: ${connectionId}`
      );
    } else {
      console.error(
        `Error sending message to ConnectionId: ${connectionId}`,
        error
      );
    }
  }
}

module.exports = { sendMessageToClient };
