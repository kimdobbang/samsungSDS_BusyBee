// utils/apiGatewayClient.js
// WebSocket 연결을 통해 클라이언트에게 메시지를 전송하는 유틸리티 함수

const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { saveChat } = require("../ddb/dynamoDbClient");
const { invokeDisconnectHandler } = require("../utils/lambdaClients");
const apigatewayManagementApi = new ApiGatewayManagementApiClient({
  endpoint: `https://${process.env.DOMAIN_NAME}/${process.env.STAGE}`,
});

// 첫 접속시
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

    await apigatewayManagementApi.send(command);
    await saveChat(orderId, connectionId, chatMessage);
    console.log(
      `Message sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 410) {
      console.error(
        `Message - Client disconnected - markSessionInactive orderId: ${orderId}`
      );
      await invokeDisconnectHandler(orderId, connectionId);
    } else {
      console.error(`Error sending message to orderId: ${orderId}`, error);
    }
  }
}

// 기존 히스토리전송
async function sendChatHistoryToClientWithoutSave(
  orderId,
  connectionId,
  chatHistory
) {
  try {
    const chatMessage = {
      timestamp: chatHistory.timestamp,
      senderType: chatHistory.senderType,
      message: chatHistory.message,
    };

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    await apigatewayManagementApi.send(command);
    console.log(
      `History sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.error(
        `History - Client disconnected - sendChatHistoryToClient: ${connectionId}`
      );
      invokeDisconnectHandler(orderId, connectionId);
    } else {
      console.error(
        `Error sending message to connectionId: ${connectionId}`,
        error
      );
    }
  }
}

// 재접속시
async function sendInformToClient(orderId, connectionId, message, senderType) {
  try {
    const timestamp = new Date().toISOString();

    const chatMessage = {
      timestamp,
      message,
      senderType,
    };

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    await apigatewayManagementApi.send(command);
    await saveChat(orderId, connectionId, chatMessage);
    console.log(
      `Inform sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.error(
        `Inform - Client disconnected - sendInformToClient ${connectionId}`
      );
      invokeDisconnectHandler(orderId, connectionId);
    } else {
      console.error(
        `Error sending message to connectionId: ${connectionId}`,
        error
      );
    }
  }
}

module.exports = {
  sendMessageToClient,
  sendChatHistoryToClientWithoutSave,
  sendInformToClient,
};
