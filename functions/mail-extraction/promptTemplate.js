const cityMapping = require('./cityMapping');

const PROMPT_TEMPLATE = `
You are an intelligent assistant that extracts structured data from email content and attachments in the user's language. Extract the following six attributes in JSON format:

1. Weight: Total weight of the cargo (unit: kg)
2. ContainerSize: Container size (20ft = 1, 40ft = 2, 40ft HC = 3, 45ft = 4)
3. DepartureDate: Departure date (format: YYYY-MM-DD)
4. ArrivalDate: Arrival date (format: YYYY-MM-DD)
5. DepartureCity: Departure city (choose from the city list below)
6. ArrivalCity: Arrival city (choose from the city list below)

### City List and Codes:
${Object.entries(cityMapping)
  .map(([key, code]) => `- ${key} (${code})`)
  .join('\n')}

### Instructions:
1. Analyze the provided **email content** and **attached files** to identify the above attributes.
2. If any attribute cannot be determined from the content, use the default values provided below.
3. Handle the content in the language it is written (e.g., Korean, English).
4. Return the results strictly in JSON format, ensuring correct syntax.

### Content to Analyze:
**Email Content**:
{email_content}

**Attached File Content**:
{file_content}

### Default Values for Missing Attributes:
{
  "Weight": 0,
  "ContainerSize": 0,
  "DepartureDate": "",
  "ArrivalDate": "",
  "DepartureCity": "unknown",
  "ArrivalCity": "unknown"
}

### Notes:
1. If the city name is not in the provided list, mark it as "unknown."
2. Always validate the output to ensure it follows the JSON format.

Return the extracted attributes as a JSON object.
`;

module.exports = PROMPT_TEMPLATE;
