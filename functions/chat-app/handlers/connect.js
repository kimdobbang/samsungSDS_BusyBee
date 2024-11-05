// handlers/connect.js
// 연결시 DB조회를 통해 입력 받아야 할 정보 알아야함
const { formatTimestamp } = require("../common/utils/formatUtils");

const {
  saveConnection,
  updateConnection,
  getSessionData,
} = require("../common/ddb/dynamoDbClient");
const { getOrderData } = require("../common/ddb/orderDynamoDbClient");

const { sendMessageToClient } = require("../common/utils/apiGatewayClient");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  // const orderId = event.queryStringParameters["order-id"]; // 쿼리 문자열에서 order-id 가져오기
  const orderId = "testdata2"; // 임시 하드코딩
  console.log(`연결성공 - ConnectionId: ${connectionId}, OrderId: ${orderId}`);

  try {
    if (!orderId) {
      throw new Error("Order ID not provided in the query string.");
    }

    // orderId로 채팅 세션 데이터 조회
    const existingSessionData = await getSessionData(orderId);

    // 초기화
    let sender = "";
    let sessionStatus = existingSessionData
      ? existingSessionData.sessionStatus
      : "inProgress";
    let isSessionActive = true;
    let responsedData = {};
    let pendingFields = {};
    let lastInteractionTimestamp = "";
    let chatHistory = [];

    // orderId가 존재하는 경우: 기존 데이터 사용
    if (existingSessionData) {
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

      // 기존 저장 데이터 할당
      isSessionActive = existingSessionData.isSessionActive;
      chatHistory = existingSessionData.chatHistory;

      // 이미 존재하는 연결정보에 최신정보업데이트
      console.log(`이미 존재하는 id정보 업뎃 - Before updateConnection:`);
      await updateConnection(orderId, connectionId, isSessionActive);

      // 채팅 기록을 시간 순서에 따라 보여줌
      chatHistory.forEach((chat) => {
        console.log(`${chat.timestamp} - ${chat.senderType}: ${chat.message}`);
      });

      // 추가 정보 요청 시작 메시지 전송
      const formattedDateTime = formatTimestamp(lastInteractionTimestamp);
      await sendMessageToClient(
        orderId,
        connectionId,
        `아직 제게 전달해주지 않으신 정보가 남아있습니다! ${formattedDateTime} 이후의 대화를 이어가겠습니다.`,
        "bot"
      );

      // orderId가 존재하지 않는 경우: estimate 에서 새로운 데이터를 가져와야 함
    } else {
      console.log("최초 접속(기존 데이터 없음)");
      const newoOrderData = await getOrderData(orderId); // estimate 테이블에서 orderId로 데이터 가져오기

      if (!newoOrderData || !newoOrderData.value) {
        throw new Error("order data not found in estimate table.");
      }
      // 가져온 데이터를 JSON 문자열로 변환
      let parsedData;
      try {
        parsedData = JSON.parse(newoOrderData.value); // value에서 문자열로 인코딩된 JSON 파싱
      } catch (error) {
        console.error(
          `Failed to parse order data value: ${newoOrderData.value}`
        );
        throw new Error("Invalid JSON format in order data.");
      }

      // 채팅세션정보 DB에 저장할 데이터 구성
      responsedData = parsedData.data || {};
      sender = parsedData.sender || "";

      // pendingFields생성
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
      requiredFields.forEach((field) => {
        if (!responsedData[field]) {
          pendingFields[field] = "omission";
        } else if (responsedData[field] === "unknown") {
          pendingFields[field] = "unknown";
        } else if (responsedData[field] === "0") {
          pendingFields[field] = "omission";
        }
      });

      // 연결 정보를 포함하여 연결정보DB에 저장
      console.log("최초접속 정보저장-Session Data before saving");
      await saveConnection(orderId, connectionId, {
        sender,
        isSessionActive,
        sessionStatus,
        pendingFields,
        responsedData,
        chatHistory,
      });
      // 시작 메시지 전송
      await sendMessageToClient(
        orderId,
        connectionId,
        `안녕하세요! 견적 요청을 주셔서 감사합니다. 요청주신 내용을 검토해보니, ${
          Object.keys(pendingFields).length
        }가지 정보가 누락 되었네요! 제가 추가 정보를 요청 드리겠습니다.`,
        "bot"
      );
    }

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
