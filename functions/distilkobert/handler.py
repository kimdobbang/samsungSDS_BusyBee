import os
import json
import boto3
import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# 환경 변수
S3_BUCKET = os.environ["S3_BUCKET"]
MODEL_PREFIX = os.environ["MODEL_PREFIX"]

# 모델 디렉토리 설정
MODEL_DIR = "/tmp/model"
os.makedirs(MODEL_DIR, exist_ok=True)

# S3에서 모델 다운로드
def download_model():
    s3 = boto3.client("s3")
    files = ["config.json", "pytorch_model.bin", "vocab.txt"]
    for file_name in files:
        s3.download_file(S3_BUCKET, f"{MODEL_PREFIX}{file_name}", os.path.join(MODEL_DIR, file_name))

# 모델 및 토크나이저 로드
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    return tokenizer, model

# Lambda 핸들러
def inference(event, context):
    try:
        # S3에서 모델 다운로드 및 로드
        download_model()
        tokenizer, model = load_model()

        # 요청 데이터 가져오기
        body = json.loads(event["body"])
        texts = body.get("inputs", [])

        # 입력 데이터를 토큰화
        inputs = tokenizer(
            texts,
            return_tensors="pt",
            padding=True,
            truncation=True,
            max_length=512
        )

        # 추론 수행
        with torch.no_grad():
            outputs = model(**inputs)
            predictions = torch.nn.functional.softmax(outputs.logits, dim=-1).tolist()

        # 결과 반환
        return {
            "statusCode": 200,
            "body": json.dumps({"predictions": predictions})
        }
    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
