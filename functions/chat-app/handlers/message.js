// handlers/message
const { sendMessageToClient, sendInformToClient } = require("../common/utils/apiGatewayClient");
const { makeApiRequest } = require("../common/utils/apiRequest");
const { saveChat, getOrderIdByConnectionId } = require("../common/ddb/dynamoDbClient");
const {
  createChatbotRequestMessage,
  parseChatbotResponse,
  parseClientMessage,
  ClientError,
} = require("../common/utils/requestResponseHelper");

module.exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2));
  const connectionId = event.requestContext.connectionId;

  try {
    const { orderId } = await getOrderIdByConnectionId(connectionId);
    if (!orderId) {
      console.log(`OrderId not found for ConnectionId: ${connectionId}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "OrderId not found" }),
      };
    }

    // 클라이언트 메시지 파싱 및 공백검사 후 저장
    let action, clientMessage;
    try {
      ({ action, clientMessage } = parseClientMessage(event.body));
    } catch (error) {
      if (error instanceof ClientError) {
        console.log(`Client error for ConnectionId: ${connectionId}`, error);
        await sendInformToClient(connectionId, error.message, "bot");
        return {
          statusCode: 400,
          body: JSON.stringify({ message: error.message }),
        };
      }
      throw error;
    }

    const clientMessageData = {
      timestamp: new Date().toISOString(),
      senderType: "customer",
      message: clientMessage,
    };
    await saveChat(orderId, clientMessageData);

    // LLM API 응답 클라이언트에 전달
    const requestData = createChatbotRequestMessage(clientMessage);
    const llmApiUrl = `${process.env.LLM_API_URL}?orderId=${orderId}`;
    console.log(`Sending message to LLM API for orderId: ${orderId}, URL: ${llmApiUrl}`);
    const response = await makeApiRequest(llmApiUrl, requestData);
    const { llmResponse } = parseChatbotResponse(response);
    await sendMessageToClient(connectionId, llmResponse, "bot");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Message processed for ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.error(`Error processing message for ConnectionId: ${connectionId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
