// functions\chat-app\handlers\completion.js
// 모든 정보가 수집되고 세션이 정상적으로 종료될 때 호출.
// responsed data 를 sqs에 넣기 성공시 disconnect 이벤트 트리거
const { LambdaClient, InvokeCommand } = require("@aws-sdk/client-lambda");
const lambdaClient = new LambdaClient({ region: process.env.AWS_REGION });
const { markSessionComplete } = require("../common/ddb/dynamoDbClient");

module.exports.handler = async (event) => {
  const { orderId } = JSON.parse(event.body);
  console.log(`Completion handler triggered for customer ${orderId}`);

  try {
    // SQS에 보낼거
    const messagePayload = {
      data: sessionData.responsedData,
      key: sessionData.orderId,
      sender: sessionData.sender,
    };
    // SQS에 메세지 뿅
    const sendMessageCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL, // Ensure you set this environment variable
      MessageBody: JSON.stringify(messagePayload),
    });

    await sqsClient.send(sendMessageCommand);
    console.log(`Message sent to SQS: ${JSON.stringify(messagePayload)}`);

    // 세션을 완료로 표시
    await markSessionComplete(orderId);

    // $disconnect 핸들러 호출
    const disconnectCommand = new InvokeCommand({
      FunctionName: process.env.DISCONNECT_FUNCTION_NAME,
      InvocationType: "Event", // 비동기 호출
      Payload: JSON.stringify({
        orderId: orderId,
        connectionId: connectionId,
      }),
    });

    await lambdaClient.send(disconnectCommand);
    console.log(`$disconnect handler invoked for orderId: ${orderId}`);

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
