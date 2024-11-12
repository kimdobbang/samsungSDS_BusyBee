package online.everymail.dto;

import lombok.Getter;

@Getter
public class SNSMessageWrapper {
    private String Type;
    private String MessageId;
    private String TopicArn;
    private String Message;
    private String Timestamp;
    private String SignatureVersion;
    private String Signature;
    private String SigningCertURL;
    private String UnsubscribeURL;
}
