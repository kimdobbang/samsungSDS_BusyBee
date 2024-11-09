const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');

const s3 = new AWS.S3();
const sqs = new AWS.SQS({ region: 'ap-northeast-2' });
const textract = new AWS.Textract();
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 프롬프트 템플릿 정의
const PROMPT_TEMPLATE = `
다음 이메일 내용과 첨부파일에서 아래의 6가지 속성을 JSON 형식으로 추출하세요:
1. Weight: 화물의 총 중량 (단위: kg)
2. ContainerSize: 컨테이너 크기 (20ft = 1, 40ft = 2, 40ft HC = 3, 45ft = 4)
3. DepartureDate: 출발 날짜 (YYYY-MM-DD 형식)
4. ArrivalDate: 도착 날짜 (YYYY-MM-DD 형식)
5. DepartureCity: 출발 도시 (아래 도시 목록에서 선택)
6. ArrivalCity: 도착 도시 (아래 도시 목록에서 선택)

### 도시 목록과 코드:
- 서울 (SEL), 인천 (ICN), 부산 (PUS), 대구 (TAE), 대전 (DCC), 광주 (KWJ)
- 울산 (USN), 제주 (CJU), 김포 (GMP), 포항 (KPO), 양양 (YNY), 청주 (CJJ)
- 원주 (WJU), 군산 (KUV), 여수 (RSU), 사천 (HIN), 목포 (MPK), 진주 (HIN)
- 속초 (SHO), 강릉 (KAG), 춘천 (CNX), 안동 (AEO), 전주 (CHN), 삼척 (SCK)

모든 결과는 JSON 형식으로 반환합니다. 도시 이름은 목록에 없는 경우 "unknown"으로 표시합니다.

내용:
{email_content}

첨부파일 내용:
{file_content}

**주의**: JSON 형식 데이터만 응답으로 제공하며, 찾을 수 없는 속성은 기본값으로 설정하세요.
기본값:
{
  "Weight": 0,
  "ContainerSize": 0,
  "DepartureDate": "",
  "ArrivalDate": "",
  "DepartureCity": "unknown",
  "ArrivalCity": "unknown"
}
`;

// 데이터 검증 및 기본값 설정
const validateExtractedData = (data) => {
  const defaultValues = {
    Weight: 0,
    ContainerSize: 0,
    DepartureDate: '',
    ArrivalDate: '',
    DepartureCity: 'unknown',
    ArrivalCity: 'unknown',
  };

  const validContainerSizes = [1, 2, 3, 4];
  const cityCodes = [
    'SEL',
    'ICN',
    'PUS',
    'TAE',
    'DCC',
    'KWJ',
    'USN',
    'CJU',
    'GMP',
    'KPO',
    'YNY',
    'CJJ',
    'WJU',
    'KUV',
    'RSU',
    'HIN',
    'MPK',
    'SHO',
    'KAG',
    'CNX',
    'AEO',
    'CHN',
    'SCK',
  ];

  return {
    Weight: typeof data.Weight === 'number' && data.Weight > 0 ? data.Weight : defaultValues.Weight,
    ContainerSize: validContainerSizes.includes(data.ContainerSize)
      ? data.ContainerSize
      : defaultValues.ContainerSize,
    DepartureDate:
      typeof data.DepartureDate === 'string' ? data.DepartureDate : defaultValues.DepartureDate,
    ArrivalDate:
      typeof data.ArrivalDate === 'string' ? data.ArrivalDate : defaultValues.ArrivalDate,
    DepartureCity: cityCodes.includes(data.DepartureCity) ? data.DepartureCity : 'unknown',
    ArrivalCity: cityCodes.includes(data.ArrivalCity) ? data.ArrivalCity : 'unknown',
  };
};

// AWS Textract를 활용하여 이미지 텍스트 추출
const extractTextFromImages = async (imageFiles) => {
  let combinedText = '';
  for (const image of imageFiles) {
    const params = { Document: { Bytes: image }, FeatureTypes: ['TABLES', 'FORMS'] };
    const response = await textract.analyzeDocument(params).promise();
    const lines = response.Blocks.filter((block) => block.BlockType === 'LINE');
    combinedText += lines.map((line) => line.Text).join(' ') + ' ';
  }
  return combinedText.trim();
};

// Lambda Handler
exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { email_content, attachments, sender } = message;

      console.log(`Processing message: ${JSON.stringify(message)}`);

      // 이메일 내용 추출
      const truncatedEmailContent = email_content || '';

      // 첨부파일 다운로드 및 분류
      const textFiles = [];
      const imageFiles = [];
      const unsupportedFiles = [];

      for (const key of attachments) {
        const params = { Bucket: 'mails-to-files', Key: key };
        const data = await s3.getObject(params).promise();
        const fileExtension = key.split('.').pop().toLowerCase();

        if (['txt', 'csv', 'docx', 'pdf'].includes(fileExtension)) {
          textFiles.push({ filename: key, file: data.Body });
        } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
          imageFiles.push(data.Body);
        } else {
          unsupportedFiles.push(key);
        }
      }

      console.log(
        `Text files: ${textFiles.length}, Image files: ${imageFiles.length}, Unsupported files: ${unsupportedFiles.join(', ')}`,
      );

      // 텍스트 파일 및 이미지 병합
      let imageText = '';
      if (imageFiles.length > 0) {
        imageText = await extractTextFromImages(imageFiles);
      }

      const combinedContent = PROMPT_TEMPLATE.replace(
        '{email_content}',
        `${truncatedEmailContent}\n첨부파일 내용:\n${textFiles
          .map((file) => file.file.toString('utf-8'))
          .join('\n')}\n${imageText}`,
      );

      // 로깅 추가
      console.log('Combined Content for OpenAI:', combinedContent);

      // OpenAI 모델 호출
      const llmResult = await openAI.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an assistant extracting attributes from email content.',
          },
          { role: 'user', content: combinedContent },
        ],
        max_tokens: 500,
      });
      console.log('OpenAI Response:', JSON.stringify(llmResult, null, 2));

      let extractedData = {};
      try {
        const content = llmResult.choices[0].message.content;
        const cleanedContent = content.replace(/```json\n?|```/g, '').trim(); // JSON 태그 제거
        extractedData = JSON.parse(cleanedContent);
      } catch (error) {
        console.error('Failed to parse extracted data:', error.message);
        extractedData = {};
      }

      // 데이터 검증
      const validatedData = validateExtractedData(extractedData);

      // 결과 메시지 생성
      const sqsMessage = {
        key: uuidv4(),
        sender,
        data: validatedData,
      };

      console.log('SQS Message Body:', JSON.stringify(sqsMessage, null, 2));

      await sqs
        .sendMessage({
          QueueUrl: process.env.EXTRACT_QUEUE_URL,
          MessageBody: JSON.stringify(sqsMessage),
        })
        .promise();

      console.log('SQS Send Success');
    } catch (error) {
      console.error('Error processing record:', error.message);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processing complete.' }) };
};
