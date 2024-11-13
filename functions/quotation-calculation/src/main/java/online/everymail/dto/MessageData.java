package online.everymail.dto;

import lombok.Getter;

@Getter
public class MessageData {
    private String key;
    private String sender;
    private String receiver;
    private String receivedDate;
    private Data data;
    private int status;
    private int quote;

    public MessageData(SQSMessageData sqsMessageData, int status, int quote) {
        this.key = sqsMessageData.getKey();
        this.sender = sqsMessageData.getSender();
        this.receiver = sqsMessageData.getReceiver();
        this.receivedDate = sqsMessageData.getReceivedDate();
        this.data = sqsMessageData.getData();
        this.status = status;
        this.quote = quote;
    }
}
