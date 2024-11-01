package online.everymail;

import lombok.AllArgsConstructor;

@AllArgsConstructor
public class SNSMessageData {
    private String key;
    private String sender;
    private Data data;
    private int quote;
}
