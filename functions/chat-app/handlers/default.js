// handlers/default.js
// 정의되지 않은 WebSocket 경로가 호출될 때 실행됩니다.websocket $default에 해당하는 헨들러

module.exports.handler = async () => {
  return { statusCode: 200, body: "his is default route. You should set abled route" };
};
