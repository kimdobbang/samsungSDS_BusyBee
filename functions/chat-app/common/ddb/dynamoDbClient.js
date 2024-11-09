// utils/dynamoDbClient.js
// 채팅 관리 테이블
const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  QueryCommand,
} = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.CHAT_SESSIONS_TABLE_NAME;

async function getSessionData(orderId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
    });
    const response = await dynamoDb.send(command);
    return response.Item;
  } catch (error) {
    console.log(`Failed to get session data for customer ${orderId}:`, JSON.stringify(error));
    throw new Error("채팅세션 데이터 조회 오류");
  }
}
async function getOrderIdByConnectionId(connectionId) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: "ConnectionIndex",
      KeyConditionExpression: "connectionId = :connectionId",
      ExpressionAttributeValues: {
        ":connectionId": connectionId,
      },
      ProjectionExpression: "orderId",
    });

    const response = await dynamoDb.send(command);

    if (response.Items && response.Items.length > 0) {
      return response.Items[0];
    } else {
      throw new Error(`No order found for connectionId: ${connectionId}`);
    }
  } catch (error) {
    console.log(`Failed to get orderId by connectionId ${connectionId}`, error);
    throw new Error("connectionId로 orderId 조회 오류");
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
    console.log(`Error updating connection:${orderId} - ${connectionId}`);
    throw new Error("connection 업데이트 오류");
  }
}

async function saveChat(orderId, chatMessage) {
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
      `Chat saved successfully for orderId:", orderId, Data: ${JSON.stringify(chatMessage)}`
    );
  } catch (error) {
    console.log("Error saving chat to DynamoDB:", error);
    throw new Error("DynamoDB 채팅 저장 오류");
  }
}

async function markSessionInactive(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: "SET isSessionActive = :inactive",
      ExpressionAttributeValues: {
        ":inactive": false,
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as complete`);
  } catch (error) {
    console.log(`Failed to mark session complete for customer ${orderId}:`, error);
    throw new Error("Session 비활성화 오류");
  }
}

async function removeConnectionId(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: "REMOVE connectionId",
    });
    await dynamoDb.send(command);
    console.log(`connectionId removed successfully for orderId: ${orderId}`);
  } catch (error) {
    console.log(`Error removing connectionId for orderId: ${orderId}`, error);
    throw new Error("DynamoDB connectionId 삭제 오류");
  }
}

async function markSessionComplete(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: "SET sessionStatus = :status",
      ExpressionAttributeValues: {
        ":status": "completed",
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as complete`);
  } catch (error) {
    console.log(`Failed to mark session complete for customer ${orderId}:`, JSON.stringify(error));
    throw new Error("세션 완료 상태 업데이트 오류");
  }
}
module.exports = {
  getSessionData,
  updateConnection,
  saveChat,
  markSessionInactive,
  removeConnectionId,
  markSessionComplete,
  getOrderIdByConnectionId,
};
