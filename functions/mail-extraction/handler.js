const AWS = require('aws-sdk');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');

const s3 = new AWS.S3();
const sqs = new AWS.SQS({ region: 'ap-northeast-2' });
const textract = new AWS.Textract();
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const cityMapping = {
  // Major cities
  서울: 'SEL',
  인천: 'ICN',
  부산: 'PUS',
  대구: 'TAE',
  대전: 'DCC',
  광주: 'KWJ',
  울산: 'USN',
  제주: 'CJU',
  수원: 'SWU',
  성남: 'SNM',
  춘천: 'CHN',
  강릉: 'GRN',

  // Airports
  김포공항: 'GMP',
  인천공항: 'ICN',
  제주공항: 'CJU',
  김해공항: 'PUS',
  대구공항: 'TAE',
  청주공항: 'CJJ',
  광주공항: 'KWJ',
  울산공항: 'USN',
  여수공항: 'RSU',
  포항공항: 'KPO',
  양양공항: 'YNY',
  원주공항: 'WJU',
  무안공항: 'MWX',
  사천공항: 'HIN',

  // Train stations
  서울역: 'SEO',
  용산역: 'YON',
  부산역: 'PSN',
  대전역: 'DJC',
  대구역: 'TAE',
  광주송정역: 'GWJ',
  울산역: 'USN',
  인천역: 'INC',
  춘천역: 'CHC',
  강릉역: 'GRG',
  수서역: 'SUS',
  동대구역: 'DDG',
  익산역: 'IKS',
  전주역: 'JJR',
  목포역: 'MKP',
  여수엑스포역: 'YSR',
  포항역: 'POH',

  // Ports
  부산항: 'BPH',
  인천항: 'IPH',
  울산항: 'UPH',
  평택항: 'PTH',
  여수항: 'YHP',
  목포항: 'MHP',
  포항항: 'PHP',
  제주항: 'JPH',
  광양항: 'GPH',
  삼천포항: 'SCH',
  동해항: 'DHH',
  속초항: 'SCH',
  마산항: 'MSH',
  진해항: 'JHH',
  군산항: 'GSH',

  // Additional locations
  서산항: 'SSH',
  태안항: 'TAH',
  울릉항: 'ULH',
  독도항: 'DDH',
  화물터미널: 'CFT',
  국제물류기지: 'ILB',
  남해항: 'NHN',
  거제항: 'GJH',

  // International Ports and Airports (for reference)
  상하이항: 'SHA',
  홍콩항: 'HKG',
  싱가포르항: 'SIN',
  도쿄항: 'TYO',
  뉴욕항: 'NYH',
  로스앤젤레스항: 'LAH',
  런던항: 'LDH',
  함부르크항: 'HAM',
  두바이항: 'DXB',
};

// 필드명과 한국어 매핑
const fieldMapping = {
  Weight: '중량',
  ContainerSize: '컨테이너 크기',
  DepartureDate: '출발 날짜',
  ArrivalDate: '도착 날짜',
  DepartureCity: '출발 도시',
  ArrivalCity: '도착 도시',
};

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
${Object.entries(cityMapping)
  .map(([key, code]) => `- ${key} (${code})`)
  .join('\n')}

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
  const cityCodes = Object.values(cityMapping);

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
const XLSX = require('xlsx');

// 엑셀 파일에서 텍스트 추출
const extractTextFromExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let extractedText = '';

  // 모든 시트 순회
  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 }); // JSON으로 변환

    // 각 셀의 데이터를 텍스트로 병합
    jsonData.forEach((row) => {
      extractedText += row.join(' ') + '\n'; // 각 행의 데이터를 공백으로 구분
    });
  });

  return extractedText.trim();
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

        if (['txt', 'csv', 'docx', 'pdf', 'doc'].includes(fileExtension)) {
          textFiles.push({ filename: key, file: data.Body });
        } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
          imageFiles.push(data.Body);
        } else if (['xls', 'xlsx'].includes(fileExtension)) {
          try {
            const excelContent = extractTextFromExcel(data.Body);
            textFiles.push({ filename: key, file: Buffer.from(excelContent, 'utf-8') });
          } catch (error) {
            console.error(`Error processing Excel file (${key}):`, error.message);
            unsupportedFiles.push(key);
          }
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
