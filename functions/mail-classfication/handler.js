// AWS 클라이언트 초기화
const AWS = require('aws-sdk');
const { ChatOpenAI } = require('@langchain/openai');

const snsClient = new AWS.SNS({ region: 'ap-northeast-2' });
const sqsClient = new AWS.SQS({ region: 'ap-northeast-2' });

const QUOTE_ORDER_SNS_TOPIC_ARN = process.env.QUOTE_ORDER_SNS_TOPIC_ARN;
const MAIL_EXTRACTION_SQS_URL = process.env.MAIL_EXTRACTION_SQS_URL;
const MAIL_SAVE_SQS_URL = process.env.MAIL_SAVE_SQS_URL;

const model = new ChatOpenAI({
  openAIApiKey: process.env.OPENAI_API_KEY,
  modelName: 'gpt-4o-mini',
  temperature: 0,
});

const mapTagToFlag = (tag) =>
  ({
    Spam: 0,
    Order: 1,
    Quote: 2,
    Other: 3, // catch-all
  })[tag] ?? 3; // Default to 3 (Other) if tag is not found

async function classifyAndExtract(input) {
  const prompt = `
  This service aims to automate freight-related quote requests and orders based on the quotes.
  Please identify the intent of the email and extract the order ID if applicable.
  
  - Email Subject: "${input.subject}"
  - Email Content: "${input.email_content}"
  
  **Order**: An order initiated to transport cargo based on a quote. Must include an "Order ID."
  **Quote**: A request regarding the estimated cost or availability of freight transportation. "Order ID" should be null.
  **Spam**: Advertising or irrelevant emails not related to logistics.
  **Other**: All emails not falling into the above categories.
  
  - Possible intents:
    - Order
    - Quote
    - Spam
    - Other
  
  - Respond in the following JSON format exactly:
  {
    "intent": "<intent>",
    "order_id": "<Order ID or null>"
  }
  
  **Note**: Do not classify as "Order" if "Order ID" is missing.
  `;

  console.log('Generated Prompt:', prompt);

  const response = await model.call([{ role: 'user', content: prompt }]);
  console.log('Model Response:', response.text);

  try {
    // 응답에서 ```json 및 ``` 제거
    const cleanResponse = response.text
      .replace(/```json/g, '')
      .replace(/```/g, '')
      .trim();

    // JSON 파싱
    const { intent, order_id } = JSON.parse(cleanResponse);
    return { intent, order_id };
  } catch (error) {
    console.error('Error parsing model response:', error.message);
    return { intent: 'Other', order_id: null };
  }
}

async function sendMessage(flag, order_id, input) {
  const message = { ...input, flag, order_id: order_id || null };
  console.log('전송 데이터:', message);

  try {
    switch (flag) {
      case 1:
        console.log('SNS로 전송 시도 중 (주문):', QUOTE_ORDER_SNS_TOPIC_ARN, message);
        const snsParams = {
          TopicArn: QUOTE_ORDER_SNS_TOPIC_ARN,
          Message: JSON.stringify(message),
        };
        await snsClient.publish(snsParams).promise();
        console.log('SNS 전송 성공 (주문).');
        break;
      case 2:
        console.log('SQS로 전송 시도 중 (견적):', MAIL_EXTRACTION_SQS_URL, message);
        const sqsExtractionParams = {
          QueueUrl: MAIL_EXTRACTION_SQS_URL,
          MessageBody: JSON.stringify(message),
        };
        await sqsClient.sendMessage(sqsExtractionParams).promise();
        console.log('SQS 전송 성공 (견적).');
        break;
      default:
        console.log('추가 전송이 필요하지 않음 (플래그):', flag);
    }
  } catch (error) {
    console.error('SNS 또는 SQS 추가 전송 실패:', error.message);
  }

  const sqsParams = {
    QueueUrl: MAIL_SAVE_SQS_URL,
    MessageBody: JSON.stringify(message),
  };
  try {
    console.log('SQS로 저장 시도 중 (기본):', MAIL_SAVE_SQS_URL, message);
    await sqsClient.sendMessage(sqsParams).promise();
    console.log('SQS로 기본 데이터 저장 성공:', message);
  } catch (error) {
    console.error('MAIL_SAVE_SQS 전송 실패:', error.message);
  }
}

module.exports.handler = async (event) => {
  console.log('Lambda 함수 호출. 이벤트:', JSON.stringify(event));

  for (const record of event.Records) {
    try {
      const input = JSON.parse(record.body);
      console.log('처리 중인 데이터:', input);

      const { intent, order_id } = await classifyAndExtract(input);
      const flag = mapTagToFlag(intent);

      console.log('분류된 의도:', intent, '플래그:', flag, '추출된 주문 ID:', order_id);

      await sendMessage(flag, order_id, input);
    } catch (error) {
      console.error('레코드 처리 중 오류 발생:', error.message);
      console.error('오류 스택:', error.stack);
    }
  }

  console.log('Lambda 함수 실행 완료.');
  return { statusCode: 200 };
};
