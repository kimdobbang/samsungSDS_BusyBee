const { unmarshall } = require('@aws-sdk/client-dynamodb');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

const REGION = 'ap-northeast-2';
const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

const sqsClient = new SQSClient({ region: REGION });

exports.dynamodbToSQSHandler = async (event) => {
  try {
    for (const record of event.Records) {
      if (record.eventName === 'MODIFY') {
        const oldImage = unmarshall(record.dynamodb.OldImage);
        const newImage = unmarshall(record.dynamodb.NewImage);

        if (!oldImage.isTagCollect && newImage.isTagCollect) {
          const messageBody = {
            emailId: newImage.emailId,
            emailContent: newImage.emailContent,
            flag: newImage.flag,
          };

          const command = new SendMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: JSON.stringify(messageBody),
          });

          await sqsClient.send(command);
          console.log(`Message sent to SQS: ${JSON.stringify(messageBody)}`);
        }
      }
    }
    return { statusCode: 200, body: 'Successfully processed events.' };
  } catch (error) {
    console.error(`Error processing DynamoDB stream: ${error.message}`);
    throw error;
  }
};
