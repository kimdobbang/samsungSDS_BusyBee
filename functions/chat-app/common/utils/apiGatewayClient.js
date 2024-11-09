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
    await saveChat(orderId, connectionId, chatMessage);
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

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });
    await apigatewayManagementApi.send(command);
    console.log(
      `History sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(chatMessage)}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.log(`History - Client disconnected - sendChatHistoryToClient: ${connectionId}`);
      invokeDisconnectHandler(orderId, connectionId);
    } else {
      console.log(`Error sending message to connectionId: ${connectionId}`, error);
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
    await saveChat(orderId, connectionId, chatMessage);
    console.log(
      `Inform sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(chatMessage)}`
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.log(`Inform - Client disconnected - sendInformToClient ${connectionId}`);
      invokeDisconnectHandler(orderId, connectionId);
    } else {
      console.log(`Error sending message to connectionId: ${connectionId}`, error);
    }
  }
}

async function disconnectClient(connectionId) {
  const command = new DeleteConnectionCommand({ ConnectionId: connectionId });
  try {
    await apiGatewayClient.send(command);
    console.log(`Connection ${connectionId} has been forcefully disconnected.`);
  } catch (error) {
    console.error(`Failed to disconnect connection ${connectionId}:`, error);
  }
}

module.exports = {
  sendMessageToClient,
  sendChatHistoryToClientWithoutSave,
  sendInformToClient,
  disconnectClient,
};
