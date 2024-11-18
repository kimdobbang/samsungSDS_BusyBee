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

import java.text.DecimalFormat;

public class SendQuoteMail implements RequestHandler<SQSEvent, Void> {

    private static final AmazonSimpleEmailService sesClient = AmazonSimpleEmailServiceClientBuilder.standard()
            .withRegion("ap-northeast-2")
            .build();
    private static final Gson gson = new Gson();
    private static final DecimalFormat decimalFormat = new DecimalFormat("#,###");


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
                            + "BusyBee의 운송 서비스를 이용해 주셔서 감사합니다. "
                            + "요청하신 운송 견적에 대한 세부사항을 아래와 같이 안내드립니다:\n\n"
                            + "운송 견적 세부 정보:\n"
                            + "주문 ID: " + parsedData.getKey() + "\n"
                            + "출발지: " + parsedData.getData().getDepartureCity() + "\n"
                            + "도착지: " + parsedData.getData().getArrivalCity() + "\n"
                            + "컨테이너 종류: " + getContainerName(parsedData.getData().getContainerSize()) + "\n"
                            + "무게: " + parsedData.getData().getWeight() + "kg\n"
                            + "출발일: " + parsedData.getData().getDepartureDate() + "\n"
                            + "도착일: " + parsedData.getData().getArrivalDate() + "\n\n"
                            + "총 예상 운송 비용: " + decimalFormat.format(parsedData.getQuote()) + "원 (VAT 별도)\n\n"
                            + "문의 및 추가 요청: 견적과 관련하여 문의사항이 있으시거나 추가 요청 사항이 있으시면 언제든지 저희에게 연락 주시기 바랍니다.\n"
                            + "감사합니다.\n"
                            + "주문을 요청을 원하시면 답장을 통해 주문을 요청해주세요";

                    String htmlBody = "<html><body>"
                            + "<h2>안녕하세요, " + parsedData.getSender() + "님</h2>"
                            + "<p>BusyBee의 운송 서비스를 이용해 주셔서 감사합니다. 요청하신 운송 견적에 대한 세부사항을 아래와 같이 안내드립니다:</p>"
                            + "<h2>운송 견적 세부 정보</h2>"
                            + "<ul>"
                            + "<li><strong>주문 ID:</strong> " + parsedData.getKey() + "</li>"
                            + "<li><strong>출발지:</strong> " + parsedData.getData().getDepartureCity() + "</li>"
                            + "<li><strong>도착지:</strong> " + parsedData.getData().getArrivalCity() + "</li>"
                            + "<li><strong>컨테이너 종류:</strong> " + getContainerName(parsedData.getData().getContainerSize()) + "</li>"
                            + "<li><strong>무게:</strong> " + parsedData.getData().getWeight() + "kg</li>"
                            + "<li><strong>출발일:</strong> " + parsedData.getData().getDepartureDate() + "</li>"
                            + "<li><strong>도착일:</strong> " + parsedData.getData().getArrivalDate() + "</li>"
                            + "</ul>"
                            + "<p><strong>총 예상 운송 비용:</strong> " + decimalFormat.format(parsedData.getQuote()) + "원 (VAT 별도)</p>"
                            + "<p>문의 및 추가 요청: 견적과 관련하여 문의사항이 있으시거나 추가 요청 사항이 있으시면 언제든지 저희에게 연락 주시기 바랍니다.</p>"
                            + "<p>감사합니다.<br>주문을 요청을 원하시면 답장을 통해 주문을 요청해주세요</p>"
                            + "</body></html>";

                    // 이메일 요청 생성
                    SendEmailRequest request = new SendEmailRequest()
                            .withDestination(new Destination().withToAddresses(parsedData.getSender()))
                            .withMessage(new Message()
                                    .withSubject(new Content().withCharset("UTF-8").withData("[견적 결과] 귀하의 운송 요청에 대한 운송 견적 안내"))
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

    private String getContainerName(int containerSize) {
        return switch (containerSize) {
            case 1 -> "20ft";
            case 2 -> "40ft";
            case 3 -> "40ft HC";
            case 4 -> "45ft";
            default -> throw new IllegalStateException("Unexpected value: " + containerSize);
        };
    }
}
