// handlers/message
const { sendMessageToClient } = require("../common/utils/apiGatewayClient");
const { makeApiRequest } = require("../common/utils/apiRequest");
const { saveChat, getOrderIdByConnectionId } = require("../common/ddb/dynamoDbClient");
const {
  createChatbotRequestMessage,
  parseChatbotResponse,
  parseClientMessage,
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
        body: JSON.stringify({ message: "Order not found" }),
      };
    }

    // 클라이언트 메시지 파싱 및 저장
    let action, clientMessage;
    try {
      ({ action, clientMessage } = parseClientMessage(event.body));
    } catch (parseError) {
      console.log(`Error parsing message for ConnectionId: ${connectionId}`, parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: parseError.message }),
      };
    }

    console.log(
      `Received message from ConnectionId: ${connectionId}, OrderId: ${orderId}, Action: ${action}`
    );
    const clientMessageData = {
      timestamp: new Date().toISOString(),
      senderType: "customer",
      message: clientMessage,
    };
    await saveChat(orderId, clientMessageData);

    // LLM API 응답객체 클라이언트에 응답
    const requestData = createChatbotRequestMessage(clientMessage);
    const llmApiUrl = process.env.LLM_API_URL;
    const response = await makeApiRequest(llmApiUrl, requestData);
    console.log("LLM API Response:", response);
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
