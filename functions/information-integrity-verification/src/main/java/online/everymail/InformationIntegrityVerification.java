package online.everymail;

import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.amazonaws.services.sns.AmazonSNS;
import com.amazonaws.services.sns.AmazonSNSClientBuilder;
import com.amazonaws.services.sns.model.PublishRequest;
import com.amazonaws.services.sns.model.PublishResult;
import com.amazonaws.services.sqs.AmazonSQS;
import com.amazonaws.services.sqs.AmazonSQSClientBuilder;
import com.amazonaws.services.sqs.model.SendMessageRequest;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import online.everymail.dto.SQSMessageData;

public class InformationIntegrityVerification implements RequestHandler<SQSEvent, Void> {

    private static final AmazonSQS sqsClient = AmazonSQSClientBuilder.defaultClient();
    private static final AmazonSNS snsClient = AmazonSNSClientBuilder.defaultClient();
    private static final String sqsUrl =
            "https://sqs.ap-northeast-2.amazonaws.com/481665114066/quotation-calculation-trigger";
    private static final String snsTopicArn = "arn:aws:sns:ap-northeast-2:481665114066:incorrect-information";
    private static final Gson gson = new Gson();

    @Override
    public Void handleRequest(SQSEvent event, Context context) {
        if (event.getRecords() != null && !event.getRecords().isEmpty()) {
            for (SQSEvent.SQSMessage message : event.getRecords()) {
                try {
                    String originalMessageBody = message.getBody();
                    context.getLogger().log("Received message: " + originalMessageBody);

                    SQSMessageData parsedData = gson.fromJson(originalMessageBody, SQSMessageData.class);

                    if (isDataValid(parsedData)) {
                        context.getLogger().log("All data is valid. Preparing to send to the success queue.");

                        SendMessageRequest sendMsgRequest = new SendMessageRequest()
                                .withQueueUrl(sqsUrl)
                                .withMessageBody(originalMessageBody);

                        sqsClient.sendMessage(sendMsgRequest);
                        context.getLogger().log("Message sent to success queue.");
                    } else {
                        context.getLogger().log("Invalid data. Sending to SNS for further handling.");

                        PublishRequest publishRequest = new PublishRequest()
                                .withTopicArn(snsTopicArn)
                                .withMessage(originalMessageBody);

                        PublishResult publishResult = snsClient.publish(publishRequest);
                        context.getLogger().log("Message published to SNS with message ID: " + publishResult.getMessageId());
                    }
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

    private boolean isDataValid(SQSMessageData data) {
        return data.getData().getWeight() != 0
                && data.getData().getContainerSize() != 0
                && data.getData().getDepartureDate() != null && !data.getData().getDepartureDate().isEmpty()
                && data.getData().getArrivalDate() != null && !data.getData().getArrivalDate().isEmpty()
                && data.getData().getDepartureCity() != null && !data.getData().getDepartureCity().isEmpty()
                && data.getData().getArrivalCity() != null && !data.getData().getArrivalCity().isEmpty();
    }
}