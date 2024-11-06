// functions\chat-app\handlers\completion.js
// 모든 정보가 수집되고 세션이 정상적으로 종료될 때 호출.
// responsed data 를 sqs에 넣기 성공시 disconnect 이벤트 트리거
const { markSessionComplete } = require("../common/ddb/dynamoDbClient");
const { invokeDisconnectHandler } = require("../common/utils/lambdaClients");
const { SendMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "ap-northeast-2" });

module.exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event, null, 2)); // 이벤트 구조 확인용
  let orderId, connectionId, sessionData;

  try {
    // orderId 추출 및 유효성 검사
    const body = JSON.parse(event.body);
    orderId = body.orderId;
    if (!orderId) {
      throw new Error("orderId is missing in the event body.");
    }

    // sessionData 가져오기
    sessionData = await getSessionData(orderId);
    if (!sessionData) {
      throw new Error(`No session data found for orderId: ${orderId}`);
    }

    connectionId = sessionData.connectionId;

    // SQS에 보낼 메시지 생성
    const messagePayload = {
      data: sessionData.responsedData,
      key: sessionData.orderId,
      sender: sessionData.sender,
    };

    // SQS에 메시지 전송
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(messagePayload),
    });

    await sqsClient.send(sendMessageCommand);
    console.log(`Message sent to SQS: ${JSON.stringify(messagePayload)}`);

    await markSessionComplete(orderId);

    await invokeDisconnectHandler(orderId, connectionId);
    return {
      statusCode: 200,
      body: `Completion process done for customer ${orderId}`,
    };
  } catch (error) {
    console.error(
      `Error during completion process for customer ${orderId}`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Completion - Internal Server Error" }),
    };
  }
};
