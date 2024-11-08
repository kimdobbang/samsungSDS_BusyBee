package online.everymail;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.sns.AmazonSNS;
import com.amazonaws.services.sns.AmazonSNSClientBuilder;
import com.amazonaws.services.sns.model.PublishRequest;
import com.amazonaws.services.sns.model.PublishResult;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import online.everymail.dto.MessageData;
import online.everymail.dto.SQSMessageData;

public class QuotationCalculation implements RequestHandler<SQSEvent, Void> {

    private static final AmazonSNS snsClient = AmazonSNSClientBuilder.defaultClient();
    private static final String snsTopicArn = "arn:aws:sns:ap-northeast-2:481665114066:save-data";
    private static final Gson gson = new Gson();

    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        if (event.getRecords() != null && !event.getRecords().isEmpty()) {
            for (SQSEvent.SQSMessage message : event.getRecords()) {
                try {
                    String originalMessageBody = message.getBody();
                    context.getLogger().log("Received message: " + originalMessageBody);

                    SQSMessageData parsedData = gson.fromJson(originalMessageBody, SQSMessageData.class);

                    int weight = parsedData.getData().getWeight();
                    int containerSize = parsedData.getData().getContainerSize();
                    String departureDate = parsedData.getData().getDepartureDate();
                    String arrivalDate = parsedData.getData().getArrivalDate();
                    String departureCity = parsedData.getData().getDepartureCity();
                    String arrivalCity = parsedData.getData().getArrivalCity();

                    // 견적 계산 로직 추가해야 함 (일단 고정값 1000)
                    int quote = 1000;

                    MessageData newData = new MessageData(parsedData, quote);

                    String newMessageBody = gson.toJson(newData);

                    context.getLogger().log("Sending to SNS for further handling.");

                    PublishRequest publishRequest = new PublishRequest()
                            .withTopicArn(snsTopicArn)
                            .withMessage(newMessageBody);

                    PublishResult publishResult = snsClient.publish(publishRequest);
                    context.getLogger().log("Message published to SNS with message ID: " + publishResult.getMessageId());
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
