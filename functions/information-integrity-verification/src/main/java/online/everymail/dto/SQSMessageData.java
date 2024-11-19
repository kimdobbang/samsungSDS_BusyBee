package online.everymail.dto;

import lombok.Getter;

@Getter
public class SQSMessageData {
    private String key;
    private String sender;
    private String receiver;
    private String receivedDate;
    private Data data;
}
