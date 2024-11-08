package online.everymail.dto;

import lombok.Getter;

@Getter
public class SQSMessageData {
    private String key;
    private String sender;
    private Data data;
    private int status;
}
