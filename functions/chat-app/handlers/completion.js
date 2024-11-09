// functions\chat-app\handlers\completion.js
// 모든 정보가 수집되고 세션이 정상적으로 종료될 때 호출.
const { markSessionComplete } = require("../common/ddb/dynamoDbClient");
const { invokeDisconnectHandler } = require("../common/utils/lambdaClients");
const { getSessionData, getOrderIdByConnectionId } = require("../common/ddb/dynamoDbClient"); // getSessionData 누락 추가
const { SendMessageCommand, SQSClient } = require("@aws-sdk/client-sqs");
const sqsClient = new SQSClient({ region: "ap-northeast-2" });

module.exports.handler = async (event) => {
  console.log("Received event:", JSON.stringify(event));
  let sessionData;
  const connectionId = event.requestContext.connectionId;
  const { orderId } = await getOrderIdByConnectionId(connectionId);


  try {
    if (!orderId) {
      throw new Error("orderId is missing in the event body.");
    }

    sessionData = await getSessionData(orderId);
    console.log(`sessionData:${JSON.stringify(sessionData)}`);
    if (!sessionData) {
      throw new Error(`No session data found for orderId: ${orderId}`);
    }

    const sqsMessagePayload = {
      data: sessionData.responsedData,
      key: sessionData.orderId,
      sender: sessionData.sender,
    };
    console.log(`sqsMessagePayload:${JSON.stringify(sqsMessagePayload)}`);

    const sqsMessageCommand = new SendMessageCommand({
      QueueUrl: process.env.SQS_QUEUE_URL,
      MessageBody: JSON.stringify(sqsMessagePayload),
    });

    await sqsClient.send(sqsMessageCommand);
    console.log(`Message sent to SQS: ${JSON.stringify(sqsMessageCommand)}`);

    await markSessionComplete(orderId);
    console.log(`Session marked as complete for orderId: ${orderId}`);


    console.log(
      `Invoking disconnect handler for orderId: ${orderId}`);
    await invokeDisconnectHandler(orderId, connectionId);
    console.log(
      `Disconnect handler successfully invoked for orderId: ${orderId}, connectionId: ${connectionId}`
    );

    return {
      statusCode: 200,
      body: `Completion process done for customer ${connectionId}`,
    };
  } catch (error) {
    console.error(
      `Error during completion process for customer ${
        connectionId
      }`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Completion - Internal Server Error" }),
    };
  }
};
