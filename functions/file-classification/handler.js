const AWS = require("aws-sdk");
const { simpleParser } = require("mailparser");

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const bucketName = process.env.S3_BUCKET;
const SQS_QUEUE_URL_MAIL = process.env.SQS_QUEUE_URL_MAIL;
const SQS_QUEUE_URL_FILE = process.env.SQS_QUEUE_URL_FILE;
const SQS_QUEUE_URL_ZIP = process.env.SQS_QUEUE_URL_ZIP;

exports.classifyEmail = async (event) => {
  try {
    // SNS 메시지 파싱
    const snsMessage = JSON.parse(event.Records[0].body);
    const s3Key = snsMessage.Records[0].s3.object.key;

    console.log("S3 객체 키:", s3Key);
    console.log("버킷 이름:", snsMessage.Records[0].s3.bucket.name);

    // S3에서 객체 가져오기
    const params = {
      Bucket: bucketName,
      Key: s3Key,
    };
    const data = await s3.getObject(params).promise();

    // 이메일 파싱
    const email = await simpleParser(data.Body);
    const sender = email.from?.text || "test@busybee.net";
    const receiver = email.to?.text || "unknown@domain.com";
    const emailBody = email.text || "";
    const subject = email.subject || "No Subject";
    const receivedDate = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    console.log("Sender:", sender);
    console.log("Receiver:", receiver);
    console.log("Email body:", emailBody);
    console.log("Subject:", subject);
    console.log("Received date:", receivedDate);

    // 첨부 파일 여부 및 ZIP 파일 확인
    const hasAttachment = email.attachments && email.attachments.length > 0;
    const hasZipAttachment = hasAttachment && email.attachments.some(att => att.contentType === 'application/zip' || att.filename.endsWith('.zip'));

    console.log("Attachment count:", hasAttachment);
    console.log("Has ZIP Attachment:", hasZipAttachment);

    // 메시지 본문 생성 후 SQS로 전송
    const messageBody = JSON.stringify({
      key: s3Key,
      email_content: emailBody,
      sender: sender,
      receiver: receiver,
      subject: subject,
      received_date: receivedDate,
      attachments: []
    });

    // ZIP 파일 여부에 따라 큐 URL 선택
    const queueUrl = hasZipAttachment ? SQS_QUEUE_URL_ZIP : (hasAttachment ? SQS_QUEUE_URL_FILE : SQS_QUEUE_URL_MAIL);

    if (queueUrl) {
      await sqs.sendMessage({
        QueueUrl: queueUrl,
        MessageBody: messageBody,
      }).promise();
      console.log("Message sent to SQS queue:", queueUrl);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File processed and message sent to SQS",
      }),
    };
  } catch (error) {
    console.error("Error processing file:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to process file",
        error: error.message,
      }),
    };
  }
};
