const { unmarshall } = require('@aws-sdk/util-dynamodb'); // 패키지 변경
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');

// SQS 클라이언트 생성
const sqsClient = new SQSClient();

const SQS_QUEUE_URL = process.env.SQS_QUEUE_URL;

if (!SQS_QUEUE_URL) {
  throw new Error('SQS_QUEUE_URL is not defined in environment variables');
}

exports.dynamodbToSQSHandler = async (event) => {
  try {
    console.log(`Received event: ${JSON.stringify(event)}`); // 전체 이벤트 로그

    const messages = []; // SQS로 보낼 메시지 배열

    for (const record of event.Records) {
      console.log(`Processing record: ${JSON.stringify(record)}`); // 각 레코드 로그

      if (record.eventName === 'MODIFY') {
        // DynamoDB 이미지를 unmarshall
        const oldImage = record.dynamodb.OldImage ? unmarshall(record.dynamodb.OldImage) : {};
        const newImage = record.dynamodb.NewImage ? unmarshall(record.dynamodb.NewImage) : {};

        console.log(`OldImage: ${JSON.stringify(oldImage)}`); // OldImage 로그
        console.log(`NewImage: ${JSON.stringify(newImage)}`); // NewImage 로그

        if (!oldImage.isTagCollect && newImage.isTagCollect) {
          const messageBody = {
            emailId: newImage.emailId,
            emailContent: newImage.emailContent,
            flag: newImage.flag,
          };

          messages.push({
            Id: newImage.emailId, // 메시지 ID (중복 방지)
            MessageBody: JSON.stringify(messageBody),
          });

          console.log(`Prepared message for SQS: ${JSON.stringify(messageBody)}`);
        }
      } else {
        console.log(`Skipping record with eventName: ${record.eventName}`); // MODIFY가 아닌 이벤트는 스킵
      }
    }

    if (messages.length > 0) {
      // SQS로 메시지 전송
      for (const msg of messages) {
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: SQS_QUEUE_URL,
            MessageBody: msg.MessageBody,
          }),
        );
      }
      console.log(`Successfully sent ${messages.length} messages to SQS`);
    } else {
      console.log('No messages to send to SQS');
    }

    return { statusCode: 200, body: 'Successfully processed events.' };
  } catch (error) {
    console.error(`Error processing DynamoDB stream: ${error.message}`);
    console.error(`Error stack: ${error.stack}`);
    throw error;
  }
};
