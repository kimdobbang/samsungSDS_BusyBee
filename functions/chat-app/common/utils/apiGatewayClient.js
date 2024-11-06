// utils/apiGatewayClient.js
// WebSocket 연결을 통해 클라이언트에게 메시지를 전송하는 유틸리티 함수

const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { saveChat } = require("../ddb/dynamoDbClient");

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

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    apigatewayManagementApi.send(command);
    saveChat(orderId, connectionId, chatMessage);
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
    } else {
      console.error(`Error sending message to orderId: ${orderId}`, error);
    }
  }
}

function sendChatHistoryToClientWithoutSave(connectionId, chatHistory) {
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

    apigatewayManagementApi.send(command);
    console.log(
      `History sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.error(
        // 연결 끊어진 경우 처리
        // TODO: 람다트리거로 $disconnect 핸들러 호출후 로그 수정
        `History - Client disconnected - sendChatHistoryToClient: ${connectionId}`
      );
    } else {
      console.error(
        `Error sending message to connectionId: ${connectionId}`,
        error
      );
    }
  }
}

function sendInformToClientWithoutSave(
  orderId,
  connectionId,
  message,
  senderType
) {
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

    apigatewayManagementApi.send(command);
    saveChat(orderId, connectionId, chatMessage);
    console.log(
      `Inform sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.error(
        // 연결 끊어진 경우 처리
        // TODO: 람다트리거로 $disconnect 핸들러 호출후 로그 수정
        `Inform - Client disconnected - sendInformToClient ${connectionId}`
      );
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
  sendInformToClientWithoutSave,
};
