const { SESClient, SendEmailCommand } = require('@aws-sdk/client-ses');
const ses = new SESClient({ region: 'ap-northeast-2' });


exports.quoteOrder = async (event) => {
  try {
    for (const record of event.Records) {

      const snsMessageBody = JSON.parse(record.body);
      const messageBody = JSON.parse(snsMessageBody.Message);
      const sender = messageBody.receiver;
      const receiver = messageBody.sender;
      const subject = messageBody.subject;
      const order_id = messageBody.order_id;
      const email_content = messageBody.email_content

      console.log(sender);
      console.log(receiver);
      console.log(subject);
      console.log(order_id);

      // 이메일 전송 설정
      const emailParams = {
        Source: sender,
        Destination: {
          ToAddresses: [receiver],
        },
        Message: {
          Subject: {
            Data: `주문 완료: ${subject}`,
            Charset: "UTF-8"
          },
          Body: {
            Text: {
              Data: `안녕하세요, ${receiver}님.\n\n주문 번호 ${order_id}에 대한 주문이 완료되었습니다.\n\n주문 내용:\n${email_content}\n\n감사합니다.`,
              Charset: "UTF-8"
            },
          },
        },
      };

      try {
        const response = await ses.send(new SendEmailCommand(emailParams));
        console.log(`Email sent to ${receiver} for order ${order_id}`, response);
      } catch (sendError) {
        console.error(`Failed to send email to ${receiver} for order ${order_id}`, sendError);
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Emails processed successfully!' }),
    };
  } catch (error) {
    console.error("Error processing SQS messages:", error);
    throw new Error("Error processing SQS messages");
  }
};
