// handlers/disconnect.js
// WebSocket 연결이 해제될 때 호출
// 세션 상태를 isSessionActive = false로 업데이트
const { markSessionInactive } = require("../common/ddb/dynamoDbClient");

module.exports.handler = async (event) => {
  // Payload에서 orderId와 connectionId를 가져올거임
  // const { orderId, connectionId } = JSON.parse(event.body);
  // const { connectionId } = JSON.parse(event.body); // JSON 문자열을 파싱하여 객체로 변환합니다.
  const orderId = "testdata2"; // 임시 하드코딩
  // console.log(`Disconnected - ConnectionId: ${connectionId}`);

  try {
    await markSessionInactive(orderId);
    console.log(`orderId ${orderId} successfully disconnect`);
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
