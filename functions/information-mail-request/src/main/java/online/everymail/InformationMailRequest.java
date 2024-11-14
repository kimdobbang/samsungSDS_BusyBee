package online.everymail;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailService;
import com.amazonaws.services.simpleemail.AmazonSimpleEmailServiceClientBuilder;
import com.amazonaws.services.simpleemail.model.*;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import online.everymail.dto.SNSMessageWrapper;
import online.everymail.dto.SQSMessageData;

public class InformationMailRequest implements RequestHandler<SQSEvent, Void> {

    private static final AmazonSimpleEmailService sesClient = AmazonSimpleEmailServiceClientBuilder.standard()
            .withRegion("ap-northeast-2")
            .build();
    private static final Gson gson = new Gson();
    private static final String emailAddress = "no-reply@busybeemail.net";

    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        if (event.getRecords() != null && !event.getRecords().isEmpty()) {
            for (SQSEvent.SQSMessage message : event.getRecords()) {
                try {
                    String originalMessageBody = message.getBody();
                    context.getLogger().log("Received message: " + originalMessageBody);

                    SNSMessageWrapper snsMessage = gson.fromJson(message.getBody(), SNSMessageWrapper.class);
                    context.getLogger().log("Received SNS message: " + snsMessage.getMessage());

                    SQSMessageData parsedData = gson.fromJson(snsMessage.getMessage(), SQSMessageData.class);

                    // 이메일 본문 생성
                    String textBody = "안녕하세요, " + parsedData.getSender() + "님.\n"
                            + "BusyBee의 운송 서비스 이용을 신청해 주셔서 감사합니다. 원활한 견적 산정을 위해 몇 가지 추가 정보가 필요합니다. "
                            + "추가 정보 입력을 위해 아래 링크를 통해 정보를 제출해 주시기 바랍니다.\n\n"
                            + "https://busybeemail.net/chatUI?orderId=" + parsedData.getKey() + "\n\n"
                            + "감사합니다.\n"
                            + "BusyBee: 010-1234-5678";

                    String htmlBody = "<html><body>"
                            + "<h2>안녕하세요, " + parsedData.getSender() + "님</h2>"
                            + "<p>BusyBee의 운송 서비스 이용을 신청해 주셔서 감사합니다. 원활한 견적 산정을 위해 몇 가지 추가 정보가 필요합니다.</p>"
                            + "<p>추가 정보 입력을 위해 아래 링크를 통해 정보를 제출해 주시기 바랍니다:</p>"
                            + "<p><a href=\"https://busybeemail.net/chatUI?orderId=" + parsedData.getKey() + "\">추가 정보 입력 링크</a></p>"
                            + "<p>감사합니다.<br>BusyBee: 010-1234-5678</p>"
                            + "</body></html>";

                    // 이메일 요청 생성
                    SendEmailRequest request = new SendEmailRequest()
                            .withDestination(new Destination().withToAddresses(parsedData.getSender()))
                            .withMessage(new Message()
                                    .withSubject(new Content().withCharset("UTF-8").withData("[중요] 운송 견적 진행을 위한 추가 정보 요청"))
                                    .withBody(new Body()
                                            .withHtml(new Content().withCharset("UTF-8").withData(htmlBody))
                                            .withText(new Content().withCharset("UTF-8").withData(textBody))))
                            .withSource(parsedData.getReceiver());

                    // 이메일 전송
                    SendEmailResult result = sesClient.sendEmail(request);
                    context.getLogger().log("Email sent successfully with Message ID: " + result.getMessageId());
                } catch (JsonSyntaxException e) {
                    context.getLogger().log("Error parsing message: " + e.getMessage());
                } catch (Exception e) {
                    context.getLogger().log("Unexpected error: " + e.getMessage());
                }
            }
        } else {
            context.getLogger().log("No message received.");
        }
        return null;
    }
}
