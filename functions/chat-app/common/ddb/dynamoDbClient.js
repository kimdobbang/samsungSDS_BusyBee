// utils/dynamoDbClient.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  PutCommand,
  DeleteCommand,
  UpdateCommand,
  GetCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamoDb = DynamoDBDocumentClient.from(client);
const CHAT_SESSIONS_TABLE = process.env.TABLE_NAME;

// connectionId 저장
async function saveConnection(customerId, connectionId) {
  try {
    const command = new PutCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Item: {
        customerId,
        connectionId,
        isSessionActive: true,
        sessionStatus: "inProgress",
      },
    });
    await dynamoDb.send(command);
    console.log(`ConnectionId saved: ${connectionId}`);
  } catch (error) {
    console.error(
      "Error saving connectionId to DynamoDB:",
      JSON.stringify(error)
    );
    throw new Error("DynamoDB 저장 오류");
  }
}

// complete 처리

// complete 가 안되었는데 예기치 못하게 종료 되었을 때 처리

// connectionId 삭제
async function deleteConnection(connectionId) {
  try {
    const command = new DeleteCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { connectionId },
    });
    dynamoDb.send(command);
    console.log(
      `ConnectionId ${connectionId} successfully deleted from DynamoDB`
    );
  } catch (error) {
    console.error(
      `Failed to delete ConnectionId ${connectionId} from DynamoDB:`,
      JSON.stringify(error)
    );
    throw new Error("DynamoDB 삭제 오류");
  }
}

// complete 처리: 세션 상태를 완료로 표시
async function markSessionComplete(customerId) {
  try {
    const command = new UpdateCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { customerId }, // customerId가 PK인 경우
      UpdateExpression:
        "SET sessionStatus = :status, isSessionActive = :active",
      ExpressionAttributeValues: {
        ":status": "completed", // 세션 상태를 completed로 설정
        ":active": false, // 세션을 비활성화
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${customerId} marked as complete`);
  } catch (error) {
    console.error(
      `Failed to mark session complete for customer ${customerId}:`,
      JSON.stringify(error)
    );
    throw new Error("세션 완료 상태 업데이트 오류");
  }
}

// 채팅 세션 데이터 가져오기
async function getSessionData(customerId) {
  try {
    const command = new GetCommand({
      TableName: CHAT_SESSIONS_TABLE,
      Key: { customerId },
    });
    const response = await dynamoDb.send(command);
    return response.Item; // 세션 데이터 반환
  } catch (error) {
    console.error(
      `Failed to get session data for customer ${customerId}:`,
      JSON.stringify(error)
    );
    throw new Error("세션 데이터 조회 오류");
  }
}

module.exports = {
  saveConnection,
  deleteConnection,
  markSessionComplete,
  getSessionData,
};
