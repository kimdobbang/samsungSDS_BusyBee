// utils/dynamoDbClient.js
// 채팅 관리 테이블
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  // DeleteCommand,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.CHAT_SESSIONS_TABLE_NAME;

async function saveConnection(orderId, connectionId, sessionData) {
  try {
    console.log(`saveConnectionData:`, sessionData);
    const command = new PutCommand({
      TableName: TABLE_NAME,
      Item: {
        orderId,
        connectionId,
        sender: sessionData.sender,
        isSessionActive: sessionData.isSessionActive,
        sessionStatus: sessionData.sessionStatus,
        pendingFields: sessionData.pendingFields,
        responsedData: sessionData.responsedData,
        chatHistory: sessionData.chatHistory,
      },
    });

    await dynamoDb.send(command);
    console.log(`saveConnection 성공: ${orderId} - ${connectionId}`);
  } catch (error) {
    console.error(`Error saving connection:${orderId} - ${connectionId}`);
    throw new Error("connection 저장 오류");
  }
}

async function updateConnection(orderId, connectionId, isSessionActive) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: `
        SET 
          connectionId = :connectionId,
          isSessionActive = :isSessionActive
      `,
      ExpressionAttributeValues: {
        ":connectionId": connectionId,
        ":isSessionActive": isSessionActive,
      },
    });

    await dynamoDb.send(command);
    console.log(`Connection update 성공: ${orderId} - ${connectionId}`);
  } catch (error) {
    console.error(`Error updating connection:${orderId} - ${connectionId}`);
    throw new Error("connection 업데이트 오류");
  }
}

// 채팅 히스토리 저장
// TODO: 개발 완료 후 로그를 위한 connectionId 제거
async function saveChat(orderId, connectionId, chatMessage) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: `
        SET 
          chatHistory = list_append(if_not_exists(chatHistory, :empty_list), :new_chat),
          lastInteractionTimestamp = :timestamp
      `,
      ExpressionAttributeValues: {
        ":new_chat": [chatMessage],
        ":empty_list": [],
        ":timestamp": chatMessage.timestamp,
      },
    });

    await dynamoDb.send(command);
    console.log(
      `Message sent to ConnectionId & saved: ${connectionId}, Data: ${JSON.stringify(
        chatMessage
      )}`
    );
  } catch (error) {
    console.error("Error saving chat to DynamoDB:", JSON.stringify(error));
    throw new Error("DynamoDB 채팅 저장 오류");
  }
}

// complete 처리 수정예정

// connectionId 삭제 수정예정
// async function disConnection(orderId, connectionId) {
//   try {
//     const command = new DeleteCommand({
//       TableName: TABLE_NAME,
//       Key: { orderId },
//     });
//     dynamoDb.send(command);
//     console.log(
//       `ConnectionId ${connectionId} successfully deleted from DynamoDB`
//     );
//   } catch (error) {
//     console.error(
//       `Failed to delete ConnectionId ${connectionId} from DynamoDB:`,
//       JSON.stringify(error)
//     );
//     throw new Error("DynamoDB 삭제 오류");
//   }
// }
// TODO: complete 가 안되었는데 예기치 못하게 종료 되었을 때 처리 작성예정
//sessionStatus = disconnected, active= false

// disconnect 처리
async function markSessionInactive(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression:
        // "SET sessionStatus = :status, isSessionActive = :active",
        "SET isSessionActive = :active",
      ExpressionAttributeValues: {
        ":active": false,
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as complete`);
  } catch (error) {
    console.error(
      `Failed to mark session complete for customer ${orderId}:`,
      JSON.stringify(error)
    );
    throw new Error("SessionActive업데이트 오류");
  }
}

// complete 처리
async function markSessionComplete(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression:
        "SET sessionStatus = :status, isSessionActive = :active",
      ExpressionAttributeValues: {
        ":status": "completed",
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as complete`);
  } catch (error) {
    console.error(
      `Failed to mark session complete for customer ${orderId}:`,
      JSON.stringify(error)
    );
    throw new Error("세션 완료 상태 업데이트 오류");
  }
}

// 채팅 세션 데이터 가져오기
async function getSessionData(orderId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
    });
    const response = await dynamoDb.send(command);
    return response.Item; // 세션 데이터 반환
  } catch (error) {
    console.error(
      `Failed to get session data for customer ${orderId}:`,
      JSON.stringify(error)
    );
    throw new Error("채팅세션 데이터 조회 오류");
  }
}

module.exports = {
  saveConnection,
  updateConnection,
  saveChat,
  markSessionInactive,
  markSessionComplete,
  getSessionData,
};
