const { S3Client, GetObjectCommand } = require('@aws-sdk/client-s3');
const { SQSClient, SendMessageCommand } = require('@aws-sdk/client-sqs');
const { TextractClient, AnalyzeDocumentCommand } = require('@aws-sdk/client-textract');
const { v4: uuidv4 } = require('uuid');
const { OpenAI } = require('openai');
const mammoth = require('mammoth');
const XLSX = require('xlsx');

const cityMapping = require('./cityMapping');
const PROMPT_TEMPLATE = require('./promptTemplate');

// AWS Clients Initialization
const s3Client = new S3Client({ region: 'ap-northeast-2' });
const sqsClient = new SQSClient({ region: 'ap-northeast-2' });
const textractClient = new TextractClient({ region: 'ap-northeast-2' });
const openAI = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

console.log('Loaded City Mapping:', cityMapping);
console.log('Loaded Prompt Template:', PROMPT_TEMPLATE);

// Validate and Set Defaults for Extracted Data
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

// Extract Text from Images using Textract
const extractTextFromImages = async (imageFiles) => {
  let combinedText = '';
  for (const image of imageFiles) {
    const params = {
      Document: { Bytes: image },
      FeatureTypes: ['TABLES', 'FORMS'],
    };
    const command = new AnalyzeDocumentCommand(params);
    const response = await textractClient.send(command);
    const lines = response.Blocks.filter((block) => block.BlockType === 'LINE');
    combinedText += lines.map((line) => line.Text).join(' ') + ' ';
  }
  return combinedText.trim();
};

// Extract Text from Excel Files
const extractTextFromExcel = (buffer) => {
  const workbook = XLSX.read(buffer, { type: 'buffer' });
  let extractedText = '';

  workbook.SheetNames.forEach((sheetName) => {
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1 });

    jsonData.forEach((row) => {
      extractedText += row.join(' ') + '\n';
    });
  });

  return extractedText.trim();
};

// Extract Text from DOC/DOCX Files using Mammoth
const extractTextFromWord = async (buffer) => {
  try {
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } catch (error) {
    console.error('Error extracting text from Word document:', error.message);
    return '';
  }
};

// Lambda Handler
exports.handler = async (event) => {
  for (const record of event.Records) {
    try {
      const message = JSON.parse(record.body);
      const { email_content, attachments, sender } = message;

      console.log(`Processing message: ${JSON.stringify(message)}`);

      const truncatedEmailContent = email_content || '';

      // Process Attachments
      const textFiles = [];
      const imageFiles = [];
      const unsupportedFiles = [];

      for (const key of attachments) {
        const params = { Bucket: 'mails-to-files', Key: key };
        const command = new GetObjectCommand(params);
        const data = await s3Client.send(command);
        const fileBuffer = await streamToBuffer(data.Body);
        const fileExtension = key.split('.').pop().toLowerCase();

        if (['txt', 'csv', 'docx', 'doc'].includes(fileExtension)) {
          let extractedText = '';
          if (['doc', 'docx'].includes(fileExtension)) {
            extractedText = await extractTextFromWord(fileBuffer);
          } else {
            extractedText = fileBuffer.toString('utf-8');
          }
          textFiles.push({ filename: key, file: Buffer.from(extractedText, 'utf-8') });
        } else if (['jpg', 'jpeg', 'png'].includes(fileExtension)) {
          imageFiles.push(fileBuffer);
        } else if (['xls', 'xlsx'].includes(fileExtension)) {
          try {
            const excelContent = extractTextFromExcel(fileBuffer);
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

      let imageText = '';
      if (imageFiles.length > 0) {
        imageText = await extractTextFromImages(imageFiles);
      }

      const combinedContent = PROMPT_TEMPLATE.replace(
        '{email_content}',
        `${truncatedEmailContent}\nAttached file content:\n${textFiles
          .map((file) => file.file.toString('utf-8'))
          .join('\n')}\n${imageText}`,
      );

      console.log('Combined Content for OpenAI:', combinedContent);

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
        const cleanedContent = content.replace(/```json\n?|```/g, '').trim();
        extractedData = JSON.parse(cleanedContent);
      } catch (error) {
        console.error('Failed to parse extracted data:', error.message);
        extractedData = {};
      }

      const validatedData = validateExtractedData(extractedData);

      const sqsMessage = {
        key: uuidv4(),
        sender,
        data: validatedData,
      };

      console.log('SQS Message Body:', JSON.stringify(sqsMessage, null, 2));

      const sendMessageCommand = new SendMessageCommand({
        QueueUrl: process.env.EXTRACT_QUEUE_URL,
        MessageBody: JSON.stringify(sqsMessage),
      });
      await sqsClient.send(sendMessageCommand);

      console.log('SQS Send Success');
    } catch (error) {
      console.error('Error processing record:', error.message);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ message: 'Processing complete.' }) };
};

// Utility Functions
const streamToBuffer = async (stream) => {
  const chunks = [];
  for await (const chunk of stream) {
    chunks.push(chunk);
  }
  return Buffer.concat(chunks);
};
