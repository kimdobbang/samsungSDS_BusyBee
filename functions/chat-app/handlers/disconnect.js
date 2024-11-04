// handlers/disconnect.js
// WebSocket 연결이 해제될 때 호출
// 세션 상태를 isSessionActive = false로 업데이트

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const customerId = event.queryStringParameters.customerId; // 고객 ID를 쿼리 매개변수에서 가져온다고 가정

  console.log(`Disconnected - ConnectionId: ${connectionId}`);

  try {
    await deleteConnection(connectionId);
    console.log(`ConnectionId ${connectionId} successfully deleted disconnect`);
    return {
      statusCode: 200,
      body: `Disconnected - ConnectionId: ${connectionId}`,
    };
  } catch (error) {
    console.error(
      `Error during disconnect process for ConnectionId: ${connectionId}`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
