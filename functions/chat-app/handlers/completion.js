// 완료 핸들러
// 모든 정보가 수집되고 세션이 정상적으로 종료될 때 호출.
// responsed data 를 sqs에

const { markSessionComplete } = require("../common/ddb/dynamoDbClient");
module.exports.handler = async (event) => {
  const { customerId } = JSON.parse(event.body);
  console.log(`Completion handler triggered for customer ${customerId}`);

  try {
    // sqs에 보내야함
    // 세션을 완료로 표시
    await markSessionComplete(orderId, sessionStatus);
    console.log(
      `Session ${ssessionStatus} for customer ${orderId} marked as complete`
    );

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
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
