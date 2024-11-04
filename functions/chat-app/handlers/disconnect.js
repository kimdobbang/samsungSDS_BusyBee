// handlers/disconnect.js
// WebSocket 연결이 해제될 때 호출
// 세션 상태를 isSessionActive = false로 업데이트
const { markSessionDeactive } = require("../common/ddb/dynamoDbClient");

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const order = event.queryStringParameters.order;
  console.log(`Disconnected - ConnectionId: ${connectionId}`);

  try {
    await markSessionDeactive(orderId);
    console.log(`orderId ${orderId} successfully deleted disconnect`);
    return {
      statusCode: 200,
      body: `Disconnected - orderId: ${orderId}`,
    };
  } catch (error) {
    console.error(
      `Error during disconnect process for orderId: ${orderId}`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
