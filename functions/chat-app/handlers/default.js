// handlers/default.js
// 정의되지 않은 WebSocket 경로가 호출될 때 실행
const { getSessionData } = require("../common/ddb/dynamoDbClient");

module.exports.handler = async (event) => {
  const existingSessionData = await getSessionData(orderId);
  const sender = existingSessionData.sender;
  const loginUser = JSON.parse(event.body).email;

  console.log("sender", sender, "loginUser", loginUser);

  try {
    if (sender !== loginUser) {
      console.log("loginUser !== sender 왜 남의 링크에 로그인 함??? 세션 끊어버럴거임");
      return { statusCode: 403, body: "나가셈" };
    }
  } catch (error) {
    console.error("Error in default handler:", error);
    return { statusCode: 500, body: "서버 에러" };
  }
  console.log("너의 링크가 맞음", loginUser === sender);
  return { statusCode: 200, body: "어서와" };
};
