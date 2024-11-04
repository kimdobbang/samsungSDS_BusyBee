// handlers/message.js
// 클라이언트가 sendMessage 를 메시지를 보낼 때 호출
// http message에 해당하는 헨들러
// 유저 메시지를 받아 LLM에 전달하여 응답을 구성하고 클라이언트에게 전송합니다.
// 고객이 메시지를 보낼 때마다 호출되며, validateResponse와 fetchNextMissingField 로직을 포함하여 다음 단계로 진행

const { sendMessageToClient } = require("../common/utils/apiGatewayClient");
const { validProcessWithLLM } = require("../common/utils/llmClient"); // LLM API 호출 유틸리티

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  let clientMessage;

  try {
    clientMessage = JSON.parse(event.body).data; // json 파싱 시도
  } catch (parseError) {
    console.error(
      `Error parsing message from ConnectionId: ${connectionId}`,
      parseError
    );
    return {
      statusCode: 400,
      body: JSON.stringify({ message: "Invalid message format" }),
    };
  }
  console.log(
    `Received message from ConnectionId: ${connectionId}, Data: ${clientMessage}`
  );

  // LLM에 메시지를 전달하여 응답 생성 및 검증 (현재는 유저 입력을 에코하는 형식으로 가정)
  // 유저에게 응답받은 메세지를 LLM에게 검증 후 응답 반환할것임. 그리고 그다음 요청해야 할 정보도 물어봐야한다 (아직 미완성)
  try {
    // const llmValidationResponse = validProcessWithLLM(clientMessage); // TODO 개발 필요
    const llmValidationResponse = `LLM response based on received message: ${clientMessage}`;
    sendMessageToClient(connectionId, llmValidationResponse);

    // 다음 이어지는 추가정보 질문메시지 전달
    // const followUpQuestion = "추가로 어쩌고저쩌고 알려주세요.(숫자만 입력)"; // DB 기반으로 다음에 필요한 정보를 묻는 추가 질문
    // sendMessageToClient(connectionId, followUpQuestion);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Message processed for ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.error(
      `Error processing message for ConnectionId: ${connectionId}`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
