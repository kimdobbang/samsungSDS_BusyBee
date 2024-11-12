// utils/dynamoDbClient.js
// 채팅 관리 테이블
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  UpdateCommand,
  GetCommand,
  QueryCommand,
} = require('@aws-sdk/lib-dynamodb');
const { isNotDefaultValue, isValidDateFormat } = require('common/utils/formatUtils');
const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.CHAT_SESSIONS_TABLE_NAME;
const CONNECTION_INDEX = process.env.CHAT_SESSIONS_TABLE_CONNECTION_INDEX;

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
    throw new Error('채팅세션 데이터 조회 오류');
  }
}
async function getOrderIdByConnectionId(connectionId) {
  try {
    const command = new QueryCommand({
      TableName: TABLE_NAME,
      IndexName: CONNECTION_INDEX,
      KeyConditionExpression: 'connectionId = :connectionId',
      ExpressionAttributeValues: {
        ':connectionId': connectionId,
      },
      ProjectionExpression: 'orderId',
    });

    const response = await dynamoDb.send(command);

    if (response.Items && response.Items.length > 0) {
      return response.Items[0];
    } else {
      throw new Error(`No order found for connectionId: ${connectionId}`);
    }
  } catch (error) {
    console.log(`Failed to get orderId by connectionId ${connectionId}`, error);
    throw new Error('connectionId로 orderId 조회 오류');
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
        ':connectionId': connectionId,
        ':isSessionActive': isSessionActive,
      },
    });

    await dynamoDb.send(command);
    console.log(`Connection update & active 성공: ${orderId} - ${connectionId}`);
  } catch (error) {
    console.log(`Error updating connection:${orderId} - ${connectionId}`);
    throw new Error('connection 업데이트 오류');
  }
}

async function markSessionInProgress(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET sessionStatus = :status',
      ExpressionAttributeValues: {
        ':status': 'inProgress',
      },
    });

    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as inProgress`);
  } catch (error) {
    console.log(
      `Failed to mark session inProgress for customer ${orderId}:`,
      JSON.stringify(error),
    );
    throw new Error('Session status 업데이트 오류');
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
        ':new_chat': [chatMessage],
        ':empty_list': [],
        ':timestamp': chatMessage.timestamp,
      },
    });

    await dynamoDb.send(command);
    console.log(`Chat saved successfully for orderId:", orderId}`);
  } catch (error) {
    console.log('Error saving chat to DynamoDB:', error);
    throw new Error('DynamoDB 채팅 저장 오류');
  }
}

async function markSessionInactive(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET isSessionActive = :inactive',
      ExpressionAttributeValues: {
        ':inactive': false,
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as complete`);
  } catch (error) {
    console.log(`Failed to mark session complete for customer ${orderId}:`, error);
    throw new Error('Session 비활성화 오류');
  }
}

async function removeConnectionId(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'REMOVE connectionId',
    });
    await dynamoDb.send(command);
    console.log(`connectionId removed from DynamoDB successfully for orderId: ${orderId}`);
  } catch (error) {
    console.log(`Error removing connectionId for orderId: ${orderId}`, error);
    throw new Error('DynamoDB connectionId 삭제 오류');
  }
}

async function markSessionComplete(orderId) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET sessionStatus = :status',
      ExpressionAttributeValues: {
        ':status': 'completed',
      },
    });
    await dynamoDb.send(command);
    console.log(`Session for customer ${orderId} marked as complete`);
  } catch (error) {
    console.log(`Failed to mark session complete for customer ${orderId}:`, JSON.stringify(error));
    throw new Error('세션 완료 상태 업데이트 오류');
  }
}
async function updateResponsedDataAndRemovePendingFields(orderId, updatedFields) {
  try {
    // 현재 세션 데이터 가져오기
    const sessionData = await getSessionData(orderId);
    if (!sessionData) {
      throw new Error(`Session data not found for orderId: ${orderId}`);
    }

    const currentResponsedData = sessionData.responsedData || {};
    const newResponsedData = { ...currentResponsedData };

    // responsedData 업데이트 및 제거 대상 필드 수집
    const fieldsToRemove = [];
    for (const [key, value] of Object.entries(updatedFields)) {
      if (isNotDefaultValue(value)) {
        // 날짜 필드에 대한 형식 검증
        if ((key === 'DepartureDate' || key === 'ArrivalDate') && !isValidDateFormat(value)) {
          console.warn(`Invalid date format for ${key}: ${value}. Skipping update.`);
          continue;
        }
        newResponsedData[key] = value;
        fieldsToRemove.push(key); // 유효한 값은 제거 대상에 추가
      } else if (value === 'unknown' && (key === 'DepartureCity' || key === 'ArrivalCity')) {
        console.warn(`Field ${key} is set to 'unknown' for orderId: ${orderId}`);
        newResponsedData[key] = 'unknown';
      }
    }

    console.log('Updated responsedData:', JSON.stringify(newResponsedData, null, 2));

    // DynamoDB UpdateExpression 생성
    const updateExpressions = [];
    const expressionAttributeValues = {};
    const expressionAttributeNames = {};

    // responsedData 업데이트
    updateExpressions.push('SET #responsedData = :updatedResponsedData');
    expressionAttributeValues[':updatedResponsedData'] = newResponsedData;
    expressionAttributeNames['#responsedData'] = 'responsedData';

    // pendingFields 제거
    if (fieldsToRemove.length > 0) {
      updateExpressions.push(
        `REMOVE ${fieldsToRemove.map((field) => `#pendingFields.#${field}`).join(', ')}`,
      );
      fieldsToRemove.forEach((field) => {
        expressionAttributeNames[`#${field}`] = field;
      });
      expressionAttributeNames['#pendingFields'] = 'pendingFields';
    }

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: updateExpressions.join(' '),
      ExpressionAttributeValues: expressionAttributeValues,
      ExpressionAttributeNames: expressionAttributeNames,
    });

    await dynamoDb.send(command);
    console.log(
      `ResponsedData updated and validated fields removed for orderId: ${orderId}, removed fields: ${fieldsToRemove.join(', ')}`,
    );
  } catch (error) {
    console.error(
      `Failed to update responsedData and remove validated fields for orderId ${orderId}:`,
      error,
    );
    throw new Error('responsedData 업데이트 및 pendingFields 제거 오류');
  }
}

async function updatePendingFields(orderId, updatedFields) {
  try {
    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: `
        SET ${Object.keys(updatedFields)
          .map((key, index) => `pendingFields.${key} = :value${index}`)
          .join(', ')}
      `,
      ExpressionAttributeValues: Object.fromEntries(
        Object.entries(updatedFields).map(([key, value], index) => [`:value${index}`, value]),
      ),
    });

    await dynamoDb.send(command);
    console.log(`Pending fields updated for orderId: ${orderId}`);
  } catch (error) {
    console.error(`Failed to update pending fields for orderId ${orderId}:`, error);
    throw new Error('Pending fields 업데이트 오류');
  }
}

async function resetPendingFields(orderId, fieldsToReset) {
  try {
    const sessionData = await getSessionData(orderId);
    if (!sessionData || !sessionData.pendingFields) {
      throw new Error(`Session data not found for orderId: ${orderId}`);
    }

    const updatedPendingFields = { ...sessionData.pendingFields };

    // omission으로 복원
    fieldsToReset.forEach((field) => {
      updatedPendingFields[field] = 'omission';
    });

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET pendingFields = :updatedPendingFields',
      ExpressionAttributeValues: {
        ':updatedPendingFields': updatedPendingFields,
      },
    });

    await dynamoDb.send(command);
    console.log(`Pending fields reset to omission for orderId: ${orderId}`);
  } catch (error) {
    console.error(`Failed to reset pending fields for orderId ${orderId}:`, error);
    throw new Error('Pending fields 리셋 오류');
  }
}

module.exports = {
  getSessionData,
  getOrderIdByConnectionId,
  updateConnection,
  saveChat,
  markSessionInProgress,
  markSessionComplete,
  markSessionInactive,
  removeConnectionId,
  updateResponsedDataAndRemovePendingFields,
  updatePendingFields,
  resetPendingFields,
};
