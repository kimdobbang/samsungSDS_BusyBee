// utils/apiGatewayClient.js
const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  DeleteConnectionCommand,
} = require("@aws-sdk/client-apigatewaymanagementapi");
const { saveChat, getOrderIdByConnectionId } = require("../ddb/dynamoDbClient");
const { invokeDisconnectHandler } = require("../utils/lambdaClients");
const apigatewayManagementApi = new ApiGatewayManagementApiClient({
  endpoint: `https://${process.env.DOMAIN_NAME}/${process.env.STAGE}`,
});

async function sendMessageToClient(connectionId, message, senderType) {
  try {
    const { orderId } = await getOrderIdByConnectionId(connectionId);
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
    await saveChat(orderId, chatMessage);
    console.log(
      `Message sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(chatMessage)}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 410) {
      console.log(`Message - Client disconnected - markSessionInactive orderId: ${orderId}`);
    } else {
      console.log(`Error sending message to orderId: ${orderId}`, error);
    }
  }
}

async function sendChatHistoryToClientWithoutSave(orderId, connectionId, chatHistory) {
  try {
    const chatMessage = {
      timestamp: chatHistory.timestamp,
      senderType: chatHistory.senderType,
      message: chatHistory.message,
    };
    // PostToConnectionCommand호출시 클라이언트 연결 끊어진 상태면 410오류 발생하고 catch에서 invokeDisconnectHandler호출

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    await apigatewayManagementApi.send(command);
    console.log(
      `Successfully sent chat history to ConnectionId:   ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.log(`History - Client disconnected - sendChatHistoryToClient: ${connectionId}`);
      await invokeDisconnectHandler(orderId, connectionId);
      return;
    } else {
      console.log(`Error sending message to connectionId: ${connectionId}`, error);
      return;
    }
  }
}

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
    await saveChat(orderId, chatMessage);
    console.log(
      `Inform sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(chatMessage)}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.log(`Inform - Client disconnected - sendInformToClient ${connectionId}`);
      await invokeDisconnectHandler(orderId, connectionId);
      return;
    } else {
      console.log(`Error sending message to connectionId: ${connectionId}`, error);
      return;
    }
  }
}

async function disconnectClient(connectionId) {
  const command = new DeleteConnectionCommand({ ConnectionId: connectionId });
  try {
    await apiGatewayClient.send(command);
    console.log(`Connection ${connectionId} has been forcefully disconnected.`);
  } catch (error) {
    console.log(`Failed to disconnect connection ${connectionId}:`, error);
  }
}

module.exports = {
  sendMessageToClient,
  sendChatHistoryToClientWithoutSave,
  sendInformToClient,
  disconnectClient,
};
