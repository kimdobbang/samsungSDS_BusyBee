const AWS = require("aws-sdk");
const { simpleParser } = require("mailparser");

const s3 = new AWS.S3();
const sqs = new AWS.SQS();
const bucketName = process.env.S3_BUCKET;
const SQS_QUEUE_URL_MAIL = process.env.SQS_QUEUE_URL_MAIL;
const SQS_QUEUE_URL_FILE = process.env.SQS_QUEUE_URL_FILE;
const SQS_QUEUE_URL_ZIP = process.env.SQS_QUEUE_URL_ZIP;

exports.classifyEmail = async (event) => {
  console.log("Lambda 함수 시작. 이벤트:", JSON.stringify(event, null, 2));
  
  try {
    // SNS 메시지 파싱
    const snsMessage = JSON.parse(event.Records[0].body);
    console.log("SNS 메시지 파싱 결과:", JSON.stringify(snsMessage, null, 2));

    const s3Key = snsMessage.Records[0].s3.object.key;
    console.log("S3 객체 키:", s3Key);

    const bucketNameFromMessage = snsMessage.Records[0].s3.bucket.name;
    console.log("S3 버킷 이름 (SNS 메시지에서):", bucketNameFromMessage);

    // S3에서 객체 가져오기
    const params = {
      Bucket: bucketName,
      Key: s3Key,
    };
    console.log("S3 getObject 요청 매개변수:", params);

    const data = await s3.getObject(params).promise();
    console.log("S3에서 데이터 가져오기 성공.");

    // 이메일 파싱
    const email = await simpleParser(data.Body);
    console.log("이메일 파싱 결과:", JSON.stringify(email, null, 2));

    const sender = email.from?.text || "test@busybee.net";
    const receiver = email.to?.text || "unknown@domain.com";
    const emailBody = email.text || "";
    const subject = email.subject || "No Subject";
    const receivedDate = new Date().toLocaleString("ko-KR", { timeZone: "Asia/Seoul" });

    console.log("보낸 사람:", sender);
    console.log("받는 사람:", receiver);
    console.log("이메일 본문:", emailBody);
    console.log("제목:", subject);
    console.log("수신 날짜:", receivedDate);

    // 첨부 파일 여부 및 ZIP 파일 확인
    const hasAttachment = email.attachments && email.attachments.length > 0;
    const hasZipAttachment =
      hasAttachment &&
      email.attachments.some(
        (att) =>
          att.contentType === "application/zip" || att.filename.endsWith(".zip")
      );

    console.log("첨부 파일 여부:", hasAttachment);
    console.log("ZIP 첨부 파일 여부:", hasZipAttachment);

    const attachments = email.attachments?.map(att => ({
      filename: att.filename,
      contentType: att.contentType,
      size: att.size,
    })) || [];

    console.log("첨부 파일 목록:", JSON.stringify(attachments, null, 2));

    // 메시지 본문 생성 후 SQS로 전송
    const messageBody = JSON.stringify({
      key: s3Key,
      email_content: emailBody,
      sender: sender,
      receiver: receiver,
      subject: subject,
      received_date: receivedDate,
      attachments: attachments,
    });
    console.log("SQS 메시지 본문:", messageBody);

    // ZIP 파일 여부에 따라 큐 URL 선택
    const queueUrl = hasZipAttachment
      ? SQS_QUEUE_URL_ZIP
      : hasAttachment
      ? SQS_QUEUE_URL_FILE
      : SQS_QUEUE_URL_MAIL;
    console.log("선택된 SQS 큐 URL:", queueUrl);

    if (queueUrl) {
      const result = await sqs
        .sendMessage({
          QueueUrl: queueUrl,
          MessageBody: messageBody,
        })
        .promise();
      console.log("SQS 전송 성공. 메시지 ID:", result.MessageId);
    }

    console.log("Lambda 함수 처리 완료.");
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: "File processed and message sent to SQS",
      }),
    };
  } catch (error) {
    console.error("파일 처리 중 오류 발생:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: "Failed to process file",
        error: error.message,
      }),
    };
  }
};
