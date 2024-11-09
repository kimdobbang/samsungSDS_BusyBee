// handlers/message
const { sendMessageToClient } = require("../common/utils/apiGatewayClient");
const { makeApiRequest } = require("../common/utils/apiRequest");
const { getOrderIdByConnectionId } = require("../common/ddb/dynamoDbClient");

const {
  createChatbotRequestMessage,
  parseChatbotResponse,
} = require("../common/utils/requestResponseHelper");
// {
//   "action": "sendMessage",
//   "data": "내가 멀 알려주면 되는디?"
// }
module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const { orderId } = await getOrderIdByConnectionId(connectionId);

  let action;
  let clientMessage;
  console.log("Received event:", JSON.stringify(event, null, 2));

  try {
    // 클라이언트 메시지 파싱
    const body = JSON.parse(event.body);
    action = body.action;
    clientMessage = body.data;
  } catch (parseError) {
    console.log(`Error parsing message from ConnectionId: ${connectionId}`, parseError);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid message format" }),
    };
  }
  if (action && orderId && clientMessage) {
    console.log(
      `ConnectionId: ${connectionId}, Action: ${action}, OrderId: ${orderId}, Data: ${clientMessage}`
    );
  }
  try {
    // API Gateway의 LLM 요청 생성
    const requestData = createChatbotRequestMessage(clientMessage);
    console.log("RequestData:", requestData);
    const response = await makeApiRequest(
      orderId,
      `https://nr2499od16.execute-api.ap-northeast-2.amazonaws.com/dev/llm-interaction`,
      requestData
    );
    console.log("LLM Response:", response);

    //  API Gateway의 LLM 응답 파싱
    const { llmResponse } = parseChatbotResponse(response);
    await sendMessageToClient(orderId, connectionId, llmResponse, "bot");

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Message processed for ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.log(`Error processing message for ConnectionId: ${connectionId}`, error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
