// handlers/connect.js
// 연결시 DB조회를 통해 입력 받아야 할 정보 알아야함
//

const {
  saveConnection,
  getCustomerData,
} = require("../common/ddb/dynamoDbClient");
const { sendMessageToClient } = require("../common/utils/apiGatewayClient");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  console.log(`Connected - ConnectionId: ${connectionId}`);

  try {
    // 고객 데이터 조회(수정필요)
    // const customerData = await getCustomerData(customerId, connectionId); // 고객 데이터 조회
    // const customerId = customerData.customerId; // customerId를 추출

    // WebSocket 연결 ID 저장
    await saveConnection(customerId, connectionId);

    // 고객 데이터 조회(수정필요)
    // const customerData = await getCustomerData(customerId); // 고객의 estimate 데이터 가져오기
    // const responsedData = customerData.value.data || {}; // value에서 data 객체를 가져옴

    // pendingFields 구성
    const pendingFields = {};
    const requiredFields = [
      "ArrivalDate",
      "ArrivalCity",
      "Weight",
      "ContainerSize",
      "DepartureDate",
      "DepartureCity",
    ];

    // responsedFields에서 빈 문자열("") 또는 'unknown'인 필드를 찾아 pendingFields에 추가
    requiredFields.forEach((field) => {
      if (responsedData[field] === "" || responsedData[field] === "unknown") {
        pendingFields[field] = true; // 필드 추가
      }
    });

    // 세션 데이터에 대한 정보를 설정
    const sessionStatus = "inProgress";
    const isSessionActive = true;

    // 시작 메시지 전송
    await sendMessageToClient(
      connectionId,
      "안녕하세요! 견적 요청을 주셔서 감사합니다. 요청주신 내용을 검토해보니, 견적 산출에 필요한 추가 정보가 필요합니다."
    );

    // 연결 정보를 포함하여 DB에 세션 정보 저장
    await saveConnection(customerId, connectionId, {
      isSessionActive,
      sessionStatus,
      pendingFields,
      responsedData,
      lastInteractionTimestamp: new Date().toISOString(),
      chatHistory: [],
    });
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Connected - ConnectionId: ${connectionId}`,
      }),
    };
  } catch (error) {
    console.error(
      `Error during connection process for ConnectionId: ${connectionId}`,
      error
    );
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Internal Server Error" }),
    };
  }
};
