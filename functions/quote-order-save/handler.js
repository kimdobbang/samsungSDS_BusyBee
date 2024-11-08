const AWS = require("aws-sdk");
const dynamoDB = new AWS.DynamoDB.DocumentClient();

module.exports.quoteOrderSave = async (event) => {
  try {
    for (const record of event.Records) {
      // orderId 추출
      const snsMessageBody = JSON.parse(record.body);
      const messageBody = JSON.parse(snsMessageBody.Message);
      const orderId = messageBody.order_id;

      console.log(`Processing order_id: ${orderId}`);

      // DynamoDB의 항목 업데이트
      const params = {
        TableName: "estimate",
        Key: {
          Id: orderId,
        },
        UpdateExpression: "set #status = :newStatus",
        ExpressionAttributeNames: {
          "#status": "status",
        },
        ExpressionAttributeValues: {
          ":newStatus": 3,
        },
        ReturnValues: "UPDATED_NEW",
      };

      const result = await dynamoDB.update(params).promise();
      console.log("Update successful:", result);
    }
  } catch (error) {
    console.error("Error updating DynamoDB:", error);
  }
};
