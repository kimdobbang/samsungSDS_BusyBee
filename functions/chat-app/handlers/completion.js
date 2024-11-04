// 완료 핸들러
// 모든 정보가 수집되고 세션이 정상적으로 종료될 때 호출.
// 고객정보 DB에 데이터를 업데이트하고 세션을 완료 처리.

const { updateCustomerData } = require("../utils/customerDbClient");
const { markSessionComplete } = require("../utils/dynamoDbClient");

module.exports.handler = async (event) => {
  // 이벤트에서 customerId를 가져옴
  const { customerId } = JSON.parse(event.body); // 고객 ID를 이벤트 본문에서 파싱
  //   const completedData; // db의 responsedFields
  //   const sessionStatus = ; // db의 ssessionStatus
  console.log(`Completion handler triggered for customer ${customerId}`);

  try {
    // 고객정보 DB 업데이트
    await updateCustomerData(customerId, completedData);
    console.log(`Customer data updated for ${customerId}`);

    // 세션을 완료로 표시
    await markSessionComplete(customerId, sessionStatus);
    console.log(
      `Session ${ssessionStatus} for customer ${customerId} marked as complete`
    );

    return {
      statusCode: 200,
      body: `Completion process done for customer ${customerId}`,
    };
  } catch (error) {
    console.error(
      `Error during completion process for customer ${customerId}`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
