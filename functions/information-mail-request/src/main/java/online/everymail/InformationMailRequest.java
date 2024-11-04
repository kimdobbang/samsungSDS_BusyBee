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
            .withRegion("ap-northeast-2") // 원하는 리전으로 설정
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

                    // 이메일 요청 생성
                    SendEmailRequest request = new SendEmailRequest()
                            .withDestination(new Destination().withToAddresses(parsedData.getSender()))
                            .withMessage(new Message()
                                    .withSubject(new Content().withData("요청하신 견적 건에 대하여 추가 정보 입력 요청드립니다."))
                                    .withBody(new Body().withText(new Content().withData(
                                            "아래 url로 접속하여 챗봇의 안내에 따라 추가 정보 입력 부탁드립니다.\n"
                                            + "https://busybeemail.net/chat?order-id=" + parsedData.getKey()
                                    ))))
                            .withSource(emailAddress);

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
