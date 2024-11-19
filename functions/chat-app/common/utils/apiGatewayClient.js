const {
  ApiGatewayManagementApiClient,
  PostToConnectionCommand,
  DeleteConnectionCommand,
} = require('@aws-sdk/client-apigatewaymanagementapi');
const { TranslateClient, TranslateTextCommand } = require('@aws-sdk/client-translate');
const { saveChat, getOrderIdByConnectionId } = require('../ddb/dynamoDbClient');
const { invokeDisconnectHandler } = require('../utils/lambdaClients');

// API Gateway 클라이언트 초기화
const apigatewayManagementApi = new ApiGatewayManagementApiClient({
  endpoint: `https://${process.env.DOMAIN_NAME}/${process.env.STAGE}`,
});

// AWS Translate 클라이언트 초기화
const translateClient = new TranslateClient({
  region: process.env.AWS_REGION || 'ap-northeast-2',
});

// 번역 함수
async function translateText(text, targetLanguage = 'ko') {
  // TargetLanguage가 ko이면 번역 생략
  if (targetLanguage === 'ko') {
    console.log('Target language is Korean. Skipping translation.');
    return text;
  }

  try {
    const command = new TranslateTextCommand({
      Text: text,
      SourceLanguageCode: 'ko',
      TargetLanguageCode: targetLanguage,
    });
    const response = await translateClient.send(command);
    return response.TranslatedText;
  } catch (error) {
    console.error('Error during translation:', error);
    return text; // 번역 실패 시 원문 반환
  }
}

// 클라이언트에게 메시지 전송
async function sendMessageToClient(connectionId, message, senderType, targetLanguage = 'ko') {
  try {
    const { orderId } = await getOrderIdByConnectionId(connectionId);
    const timestamp = new Date().toISOString();

    // 메시지를 입력된 언어로 번역
    const translatedMessage = await translateText(message, targetLanguage);

    const chatMessage = {
      timestamp,
      senderType,
      message: translatedMessage, // 번역된 메시지
    };

    const command = new PostToConnectionCommand({
      ConnectionId: connectionId,
      Data: Buffer.from(JSON.stringify(chatMessage)),
    });

    await apigatewayManagementApi.send(command);
    console.log(
      `Message sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(chatMessage)}`,
    );
    await saveChat(orderId, chatMessage);
  } catch (error) {
    if (error.$metadata?.httpStatusCode === 410) {
      console.log(`Message - Client disconnected - markSessionInactive orderId: ${orderId}`);
    } else {
      console.log(`Error sending message to orderId: ${orderId}`, error);
    }
  }
}

async function sendChatHistoryToClientWithoutSave(connectionId, chatHistory) {
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
      `Successfully sent chat history to ConnectionId:   ${connectionId}, Data: ${JSON.stringify(
        chatMessage,
      )}`,
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.log(`History - Client disconnected - sendChatHistoryToClient: ${connectionId}`);
      await invokeDisconnectHandler(orderId, connectionId);
      return false;
    } else {
      console.log(`Error sending message to connectionId: ${connectionId}`, error);
      return false;
    }
  }
  return true;
}

async function sendInformToClient(connectionId, message, senderType) {
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
    console.log(
      `Inform sent to ConnectionId: ${connectionId}, Data: ${JSON.stringify(chatMessage)}`,
    );
  } catch (error) {
    if (error.$metadata?.httpStatusCode == 410) {
      console.log(`Inform - Client disconnected - sendInformToClient ${connectionId}`);
      await invokeDisconnectHandler(orderId, connectionId);
      return false;
    } else {
      console.log(`Error sending message to connectionId: ${connectionId}`, error);
      return false;
    }
  }
  return true;
}

async function disconnectClient(connectionId) {
  const command = new DeleteConnectionCommand({ ConnectionId: connectionId });
  try {
    await apigatewayManagementApi.send(command);
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
