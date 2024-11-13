const AWS = require("aws-sdk");
const { simpleParser } = require("mailparser");
const path = require("path");

const s3 = new AWS.S3();
const sqs = new AWS.SQS();

module.exports.fileDecoding = async (event) => {
  console.log("Lambda 함수 시작. 이벤트:", JSON.stringify(event, null, 2));

  try {
    for (const record of event.Records) {
      console.log("현재 처리 중인 SQS 레코드:", JSON.stringify(record, null, 2));

      const message = JSON.parse(record.body);
      console.log("SQS 메시지 파싱 결과:", JSON.stringify(message, null, 2));

      const key = message.key;
      const bucketName = "request-mail";
      console.log("처리할 S3 객체 키:", key);
      console.log("S3 버킷 이름:", bucketName);

      const params = {
        Bucket: bucketName,
        Key: key,
      };
      console.log("S3 getObject 요청 매개변수:", JSON.stringify(params, null, 2));

      const data = await s3.getObject(params).promise();
      console.log("S3 객체 가져오기 성공. 데이터 크기:", data.Body.length);

      const parsedEmail = await simpleParser(data.Body);
      console.log("이메일 파싱 결과:", JSON.stringify(parsedEmail, null, 2));

      // 각 요청마다 새로운 attachmentKeys 배열 초기화
      const attachmentKeys = [];

      for (const attachment of parsedEmail.attachments) {
        console.log("처리 중인 첨부파일:", attachment.filename);

        if (isAllowedExtension(attachment.filename)) {
          const targetBucketName = "mails-to-files";
          const attachmentKey = `${key.split("/").slice(1).join("/")}/${attachment.filename}`;
          console.log("저장 대상 S3 객체 키:", attachmentKey);

          await s3
            .putObject({
              Bucket: targetBucketName,
              Key: attachmentKey,
              Body: attachment.content,
            })
            .promise();

          attachmentKeys.push(attachmentKey);
          console.log(`첨부파일 저장 성공: ${targetBucketName}/${attachmentKey}`);
        } else {
          console.log(`확장자가 지원되지 않아 첨부파일을 건너뜁니다: ${attachment.filename}`);
        }
      }

      // SQS 메시지 전송
      const sqsParams = {
        QueueUrl: "https://sqs.ap-northeast-2.amazonaws.com/481665114066/mail-classification-trigger",
        MessageBody: JSON.stringify({
          key: key,
          sender: message.sender,
          receiver: message.receiver,
          subject: message.subject,
          email_content: message.email_content,
          received_date: message.received_date,
          attachments: attachmentKeys, // 요청마다 독립적인 데이터
        }),
      };

      console.log("SQS 메시지 전송 매개변수:", JSON.stringify(sqsParams, null, 2));

      await sqs.sendMessage(sqsParams).promise();
      console.log("SQS 메시지 전송 성공:", sqsParams.MessageBody);
    }
    console.log("Lambda 함수 실행 완료.");
  } catch (error) {
    console.error("SQS 메시지 처리 중 오류 발생:", error);
    throw new Error("SQS 메시지 처리 중 오류");
  }
};

// 지원되는 확장자를 확인하는 함수
const isAllowedExtension = (filename) => {
  const allowedExtensions = [
    ".jpg",
    ".jpeg",
    ".png",
    ".pdf",
    ".doc",
    ".docx",
    ".hwp",
    ".xls",
    ".xlsx",
    ".csv",
    ".txt",
  ];
  const fileExtension = path.extname(filename).toLowerCase();
  console.log(
    `파일 확장자 검사: ${filename}, 확장자: ${fileExtension}, 지원 여부: ${allowedExtensions.includes(
      fileExtension
    )}`
  );
  return allowedExtensions.includes(fileExtension);
};
