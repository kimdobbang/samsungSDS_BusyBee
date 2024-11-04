package online.everymail;

import com.amazonaws.services.dynamodbv2.AmazonDynamoDB;
import com.amazonaws.services.dynamodbv2.AmazonDynamoDBClientBuilder;
import com.amazonaws.services.dynamodbv2.model.AttributeValue;
import com.amazonaws.services.dynamodbv2.model.PutItemRequest;
import com.amazonaws.services.lambda.runtime.Context;
import com.amazonaws.services.lambda.runtime.RequestHandler;
import com.amazonaws.services.lambda.runtime.events.SQSEvent;
import com.google.gson.Gson;
import com.google.gson.JsonSyntaxException;
import online.everymail.dto.SNSMessageWrapper;
import online.everymail.dto.SQSMessageData;

import java.util.HashMap;
import java.util.Map;

public class SaveData implements RequestHandler<SQSEvent, Void> {

    private static final AmazonDynamoDB dynamoDBClient = AmazonDynamoDBClientBuilder.defaultClient();
    private static final String tableName = "estimate";
    private static final Gson gson = new Gson();

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

                    // DynamoDB에 저장할 데이터 구성
                    Map<String, AttributeValue> item = new HashMap<>();
                    item.put("Id", new AttributeValue(parsedData.getKey()));
                    item.put("value", new AttributeValue().withS(gson.toJson(parsedData)));

                    // PutItemRequest 생성 및 데이터 저장
                    PutItemRequest putItemRequest = new PutItemRequest()
                            .withTableName(tableName)
                            .withItem(item);
                    dynamoDBClient.putItem(putItemRequest);

                    context.getLogger().log("Data saved to DynamoDB");
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
