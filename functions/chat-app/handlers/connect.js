// handlers/connect.js
// 연결시 DB조회를 통해 입력 받아야 할 정보 알아야함
const { formatDateTimestamp } = require("../common/utils/formatUtils");
const { invokeDisconnectHandler } = require("../common/utils/lambdaClients");
const { getOrderData } = require("../common/ddb/orderDynamoDbClient");
const {
  saveConnection,
  updateConnection,
  markSessionInactive,
  getSessionData,
} = require("../common/ddb/dynamoDbClient");
const {
  sendMessageToClient,
  sendChatHistoryToClientWithoutSave,
  sendInformToClient,
} = require("../common/utils/apiGatewayClient");

module.exports.handler = async (event) => {
  const connectionId = event.requestContext.connectionId;
  const orderId = event.queryStringParameters["orderId"];
  console.log(`연결성공 - ConnectionId: ${connectionId}, OrderId: ${orderId}`);

  try {
    if (!orderId) {
      throw new Error("Order ID not provided in the query string.");
    }

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

    if (existingSessionData) {
      // 기존 연결이 존재하고, 이전 연결을 종료하기 전이라면 비활성화 처리
      if (existingSessionData.isSessionActive) {
        console.log(`기존 활성화된 세션 비활성화 처리: OrderId: ${orderId}`);
        await markSessionInactive(orderId); // 이전 연결 비활성화
      }
      // 상태가 completed인 경우: 견적발송 안내후 세션 종료
      if (sessionStatus === "completed") {
        await sendMessageToClient(
          orderId,
          connectionId,
          "요청드린 정보를 제공에 협조 해주셔서 감사합니다! 담당자님의 이메일로 견적을 발송 해드리겠습니다.",
          "bot"
        );
        await invokeDisconnectHandler(orderId, connectionId);

        return {
          statusCode: 400,
          body: JSON.stringify({
            message: "Session completed.",
          }),
        };
      }

      // 기존 데이터를 활용하여 세션 초기화
      pendingFields = existingSessionData.pendingFields;
      chatHistory = existingSessionData.chatHistory;
      lastInteractionTimestamp =
        existingSessionData.lastInteractionTimestamp || "";
      await updateConnection(orderId, connectionId, isSessionActive);

      for (const chat of chatHistory) {
        sendChatHistoryToClientWithoutSave(orderId, connectionId, chat);
      }

      // 추가 정보 요청 시작 메시지 전송
      const formattedDateTime = formatDateTimestamp(lastInteractionTimestamp);
      await sendInformToClient(
        orderId,
        connectionId,
        `아직 제게 전달해주지 않으신 정보가 ${
          Object.keys(pendingFields).length
        }건 남아있습니다! ${formattedDateTime} 이후의 요청을 이어가겠습니다.`,
        "bot"
      );
    } else {
      // 최초생성 세션 데이터 패칭
      const newoOrderData = await getOrderData(orderId);
      if (!newoOrderData || !newoOrderData.value) {
        throw new Error("order data not found in estimate table.");
      }
      let parsedData;
      try {
        parsedData = JSON.parse(newoOrderData.value);
      } catch (error) {
        console.error(
          `Failed to parse order data value: ${newoOrderData.value}`
        );
        throw new Error("Invalid JSON format in order data.");
      }

      // 채팅세션정보 DB에 저장할 데이터 구성 및 저장
      responsedData = parsedData.data || {};
      sender = parsedData.sender || "";
      const requiredFields = [
        "Weight",
        "ContainerSize",
        "DepartureDate",
        "ArrivalDate",
        "ArrivalCity",
        "DepartureCity",
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
