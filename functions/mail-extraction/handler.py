import os
import boto3
import json
from langchain.chains import LLMChain
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

PROMPT_TEMPLATE = """
다음 이메일 내용에서 아래의 6가지 속성에 해당하는 정보를 JSON 형식으로 추출하세요.
각 도시명을 아래 `City Code`로 매핑하여 일관성 있게 표시하세요. 만약 목록에 없는 도시는 "unknown"으로 표시하세요.

[List of attributes]
1. Weight:type(integer)
2. ContainerSize:type(integer)
3. DepartureDate:type(Date)
4. ArrivalDate:type(Date)
5. DepartureCity:type(string) - 도시명과 `City Code` 목록 참조
6. ArrivalCity:type(string) - 도시명과 `City Code` 목록 참조

도시명과 `City Code` 목록:
- New York (JFK)
- Los Angeles (LAX)
- San Francisco (SFO)
- Chicago (ORD)
- London (LHR)
- Paris (CDG)
- Tokyo (HND)
- Beijing (PEK)
- Sydney (SYD)
- Seoul (ICN)
- Dubai (DXB)
- Frankfurt (FRA)
- Singapore (SIN)
- Hong Kong (HKG)
- Toronto (YYZ)
- Johor Bahru, Malaysia (JHB)
- Incheon, South Korea (ICN)
- Busan, South Korea (PUS)
- Frankfurt, Germany (FRA)
- Shenzhen, China (SZX)
- Hanoi, Vietnam (HAN)

이메일 내용:
{email_content}

JSON 형식 데이터만 응답으로 제공해 주세요. 목록에 없는 도시는 "unknown"으로 표시해 주세요. 찾을 수 없는 속성은 빈 값을 넣어주세요.
"""

def create_extraction_chain():
    openai_api_key = os.environ['OPENAI_API_KEY']
    llm = ChatOpenAI(api_key=openai_api_key, model="gpt-4o-mini", temperature=0, max_retries=2)
    prompt = PromptTemplate(template=PROMPT_TEMPLATE, input_variables=["email_content"])
    return LLMChain(llm=llm, prompt=prompt)

def lambda_handler(event, context):
    sqs_client = boto3.client("sqs")
    extract_queue_url = os.environ["EXTRACT_QUEUE_URL"]

    print("Lambda function invoked with event:", event)  # Log 전체 이벤트

    for record in event["Records"]:
        # 이메일 내용을 포함하는 메시지 본문 가져오기
        message = json.loads(record["body"])
        email_content = message.get("email_content", "")
        object_key = message.get("key", "")
        sender = message.get("sender", "")

        print(f"Processing email content: {email_content[:100]}...")  # Log 이메일 본문 일부
        print(f"S3 object key: {object_key}")  # Log S3 객체 키
        print(f"Sender: {sender}")  # Log 발신자 정보

        # 추출 체인 생성 및 실행
        extraction_chain = create_extraction_chain()
        result = extraction_chain.run(email_content=email_content)
        
        print("LLM extraction result:", result)  # Log LLM의 추출 결과

        result_cleaned = result.strip("```json\n").strip("\n```")
        
        try:
            result_json = json.loads(result_cleaned)
        except json.JSONDecodeError:
            result_json = {
                "error": "Failed to parse LLM response to JSON",
                "llm_output": result
            }
            print("JSON decoding error:", result_json)  # Log JSON 디코딩 오류 발생 시

        # 추출된 정보와 S3 키, 발신자 정보 포함하여 SQS에 전송
        response = sqs_client.send_message(
            QueueUrl=extract_queue_url,
            MessageBody=json.dumps({
                "data": result_json,
                "key": object_key,
                "sender": sender
            })
        )
        print("SQS send message response:", response)  # Log SQS 전송 응답

    print("Lambda function execution completed.")
    return {
        "statusCode": 200,
        "body": result_json
    }
