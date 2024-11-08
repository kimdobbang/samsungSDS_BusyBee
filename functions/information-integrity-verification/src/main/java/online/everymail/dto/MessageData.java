package online.everymail.dto;

import lombok.Getter;

@Getter
public class MessageData {
    private String key;
    private String sender;
    private Data data;
    private int status;

    public MessageData(SQSMessageData sqsMessageData, int status) {
        this.key = sqsMessageData.getKey();
        this.sender = sqsMessageData.getSender();
        this.data = sqsMessageData.getData();
        this.status = status;
    }
}
