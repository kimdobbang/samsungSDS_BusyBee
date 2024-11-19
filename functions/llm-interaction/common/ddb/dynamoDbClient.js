// utils/dynamoDbClient.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, UpdateCommand, GetCommand } = require('@aws-sdk/lib-dynamodb');

const client = new DynamoDBClient({ region: 'ap-northeast-2' });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.CHAT_SESSIONS_TABLE_NAME;

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
    console.error(`Failed to get session data for customer ${orderId}:`, JSON.stringify(error));
    throw new Error('채팅세션 데이터 조회 오류');
  }
}

// 기본값 여부 확인 함수
function isNotDefaultValue(value) {
  return value !== '' && value !== 0 && value !== null && value !== undefined;
}

// responsedData 업데이트
async function updateResponsedData(orderId, updatedFields) {
  try {
    const sessionData = await getSessionData(orderId);
    if (!sessionData) {
      throw new Error(`Session data not found for orderId: ${orderId}`);
    }

    const currentResponsedData = sessionData.responsedData || {};
    const newResponsedData = { ...currentResponsedData };

    // 유효한 값만 업데이트
    for (const [key, value] of Object.entries(updatedFields)) {
      if (isNotDefaultValue(value)) {
        newResponsedData[key] = value;
      }
    }

    console.log('Updated responsedData:', JSON.stringify(newResponsedData, null, 2));

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: 'SET responsedData = :updatedResponsedData',
      ExpressionAttributeValues: {
        ':updatedResponsedData': newResponsedData,
      },
    });

    await dynamoDb.send(command);
    console.log(`ResponsedData updated for orderId: ${orderId}`);
  } catch (error) {
    console.error(`Failed to update responsedData for orderId ${orderId}:`, error);
    throw new Error('responsedData 업데이트 오류');
  }
}

// validatedFields 제거 (기본값 제외)
async function removeValidatedFields(orderId, validatedFields) {
  try {
    const sessionData = await getSessionData(orderId);
    if (!sessionData || !sessionData.pendingFields) {
      console.error(`Session data or pendingFields not found for orderId: ${orderId}`);
      return;
    }

    // 기본값이 아닌 필드만 추출
    const existingFields = validatedFields.filter(
      (field) =>
        sessionData.pendingFields.hasOwnProperty(field) &&
        isNotDefaultValue(sessionData.responsedData[field]),
    );

    if (existingFields.length === 0) {
      console.log(`No valid fields to remove for orderId: ${orderId}`);
      return;
    }

    const updateExpression = `REMOVE ${existingFields
      .map((field) => `pendingFields.${field}`)
      .join(', ')}`;

    const command = new UpdateCommand({
      TableName: TABLE_NAME,
      Key: { orderId },
      UpdateExpression: updateExpression,
      ConditionExpression: existingFields
        .map((field) => `attribute_exists(pendingFields.${field})`)
        .join(' OR '),
    });

    await dynamoDb.send(command);
    console.log(
      `Validated fields removed for orderId: ${orderId}, fields: ${existingFields.join(', ')}`,
    );
  } catch (error) {
    console.error(
      `Failed to remove validated fields for orderId ${orderId}:`,
      JSON.stringify(error),
    );
    throw new Error('Validated fields 제거 오류');
  }
}

module.exports = {
  getSessionData,
  updateResponsedData,
  removeValidatedFields,
  isNotDefaultValue, // 외부에서 필요시 사용할 수 있도록 내보냄
};
