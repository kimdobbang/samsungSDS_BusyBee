// utils/orderDynamoDbClient.js

const { DynamoDBClient } = require("@aws-sdk/client-dynamodb");
const { DynamoDBDocumentClient, GetCommand } = require("@aws-sdk/lib-dynamodb");

const client = new DynamoDBClient({ region: "ap-northeast-2" });
const dynamoDb = DynamoDBDocumentClient.from(client);
const TABLE_NAME = process.env.ORDER_DATA_TABLE_NAME;

// 고객 데이터 조회를 위한 함수
async function getOrderData(orderId) {
  try {
    const command = new GetCommand({
      TableName: TABLE_NAME,
      Key: { Id: orderId },
    });
    const response = await dynamoDb.send(command);
    return response.Item;
  } catch (error) {
    console.error(
      `Failed to get estimate data for customerId ${orderId}:`,
      JSON.stringify(error)
    );
    throw new Error("주문 데이터 조회 오류");
  }
}

module.exports = {
  getOrderData,
};
