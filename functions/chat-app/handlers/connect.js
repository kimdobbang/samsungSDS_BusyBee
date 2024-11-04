// handlers/connect.js
// 연결시 DB조회를 통해 입력 받아야 할 정보 알아야함

const {
  saveConnection,
  getSessionData,
} = require("../common/ddb/dynamoDbClient");
const { getOrderData } = require("../common/ddb/orderDynamoDbClient");

const { sendMessageToClient } = require("../common/utils/apiGatewayClient");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  // const orderId = event.queryStringParameters["order-id"]; // 쿼리 문자열에서 order-id 가져오기
  const orderId = "testdata2" // 임시 하드코딩
  console.log(`Connected - ConnectionId: ${connectionId}, OrderId: ${orderId}`);

  try {
    // 쿼리 문자열에서 orderId가 없으면 오류 처리
    if (!orderId) {
      throw new Error("Order ID not provided in the query string.");
    }

    // orderId로 채팅 세션 데이터 조회
    const existingSessionData = await getSessionData(orderId); // orderId를 사용하여 세션 데이터 조회

    // 초기화
    let sessionStatus = existingSessionData ? existingSessionData.sessionStatus : "inProgress";
    let isSessionActive = true;
    let responsedData = {};
    let pendingFields = {};
    let lastInteractionTimestamp = new Date().toISOString();
    let chatHistory = []

    // connect 되었을때 채팅 세션 데이터에 orderId가 존재하는 경우: 기존 데이터 사용
    if (existingSessionData) {
      console.log(existingSessionData)

      // 상태가 completed인 경우: 견적발송 안내후 세션 종료
      if (sessionStatus === "completed") {
        await sendMessageToClient(
            connectionId,
            "견적 산출에 필요한 정보를 제공해주셔서 감사합니다. 담당자님의 이메일로 견적을 발송해드렸습니다."
        );
        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Session completed.",
          }),
        };
      }

      // 기존 저장 데이터로 업데이트
      isSessionActive = existingSessionData.isSessionActive;
      responsedData = existingSessionData.responsedData;
      pendingFields = existingSessionData.pendingFields;
      lastInteractionTimestamp = existingSessionData.lastInteractionTimestamp;
      chatHistory = existingSessionData.chatHistory;

      // 이미 존재하는 연결정보에 최신정보업데이트
      await saveConnection(orderId, connectionId, {
        isSessionActive,
        sessionStatus,
      });

    // orderId가 존재하지 않는 경우: estimate 에서 새로운 데이터를 가져와야 함
    } else {
      const orderData = await getOrderData(orderId); // estimate 테이블에서 orderId로 데이터 가져오기
      if (!orderData || !orderData.value) {
        throw new Error("order data not found in estimate table.");
      }
      const parsedData = JSON.parse(orderData.value.S); // value에서 문자열로 인코딩된 JSON 파싱
      responsedData = parsedData.data || {};
      console.log(responsedData);

    // pendingFields 구성
    const pendingFields = {};
    const requiredFields = [
      "Weight", //TotalWeight???
      "ContainerSize",
      "DepartureDate",
      "ArrivalDate",
      "ArrivalCity",
      "DepartureCity",
      // "Quantity",
      // "Company",
      // "Company address",
      // "PIC",
      // "contanct"
    ];
    console.log(pendingFields);

      // responsedFields에서 빈 문자열("") 또는 'unknown'인 필드를 찾아 pendingFields에 추가
      requiredFields.forEach((field) => {
        if (responsedData[field] === "" || responsedData[field] === "unknown" || responsedData[field] === "0") {
          pendingFields[field] = true;
        }
      });
    }

    // 연결 정보를 포함하여 연결정보DB에 저장
    await saveConnection(orderId, connectionId, {
      isSessionActive,
      sessionStatus,
      pendingFields,
      responsedData,
      lastInteractionTimestamp,
      chatHistory,
    });

    // 시작 메시지 전송
    await sendMessageToClient(
        connectionId,
        "안녕하세요! 견적 요청을 주셔서 감사합니다. 요청주신 내용을 검토해보니, 견적 산출에 필요한 추가 정보가 필요합니다."
    );

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