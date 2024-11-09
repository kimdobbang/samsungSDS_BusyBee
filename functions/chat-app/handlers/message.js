// handlers/message
const { sendMessageToClient } = require("../common/utils/apiGatewayClient");
const { makeApiRequest } = require("../common/utils/apiRequest");
const { saveChat, getOrderIdByConnectionId } = require("../common/ddb/dynamoDbClient");
const {
  createChatbotRequestMessage,
  parseChatbotResponse,
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

    // 클라이언트 메시지 파싱
    let action, clientMessage;
    try {
      const body = JSON.parse(event.body);
      action = body.action;
      clientMessage = body.data;
    } catch (parseError) {
      console.log(`Error parsing message for ConnectionId: ${connectionId}`, parseError);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Invalid message format" }),
      };
    }

    if (!action || !clientMessage) {
      console.log(`Missing action or message data for ConnectionId: ${connectionId}`);
      return {
        statusCode: 400,
        body: JSON.stringify({ message: "Missing action or message data" }),
      };
    }

    console.log(
      `Received message from ConnectionId: ${connectionId}, OrderId: ${orderId}, Action: ${action}`
    );

    // 클라이언트 메시지 저장
    const clientMessageData = {
      timestamp: new Date().toISOString(),
      senderType: "customer",
      message: clientMessage,
    };
    await saveChat(orderId, clientMessageData);

    // LLMAPI 요청 및 응답
    const requestData = createChatbotRequestMessage(clientMessage);
    const llmApiUrl =
      process.env.LLM_API_URL || "https://your-api-endpoint.com/dev/llm-interaction";
    const response = await makeApiRequest(llmApiUrl, requestData);
    console.log("LLM API Response:", response);

    // LLM 응답 파싱 및 클라이언트로 전송
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
