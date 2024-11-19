import os
import json
import boto3
import onnxruntime as ort
from transformers import AutoTokenizer

# 환경 변수
S3_BUCKET = os.environ["S3_BUCKET"]
MODEL_PREFIX = os.environ["MODEL_PREFIX"]

# 모델 디렉토리 설정
MODEL_DIR = "/tmp/model"
os.makedirs(MODEL_DIR, exist_ok=True)

# S3에서 모델 다운로드
def download_model():
    s3 = boto3.client("s3")
    files = ["config.json", "distilkobert.onnx", "vocab.txt"]
    for file_name in files:
        s3.download_file(S3_BUCKET, f"{MODEL_PREFIX}{file_name}", os.path.join(MODEL_DIR, file_name))

# 모델 및 토크나이저 로드
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    ort_session = ort.InferenceSession(os.path.join(MODEL_DIR, "distilkobert.onnx"))
    return tokenizer, ort_session

# Lambda 핸들러
def lambda_handler(event, context):
    try:
        # S3에서 모델 다운로드 및 로드
        download_model()
        tokenizer, ort_session = load_model()

        # 요청 데이터 가져오기
        body = json.loads(event["body"])
        texts = body.get("inputs", [])

        # 입력 데이터를 토큰화 및 패딩
        inputs = tokenizer(
            texts,
            return_tensors="np",  # NumPy 배열로 변환
            padding="max_length",  # 고정 길이 패딩
            truncation=True,
            max_length=128  # 모델에서 요구하는 고정 입력 크기
        )

        # ONNX 추론 수행
        ort_inputs = {
            ort_session.get_inputs()[0].name: inputs["input_ids"],
            ort_session.get_inputs()[1].name: inputs["attention_mask"]
        }
        ort_outputs = ort_session.run(None, ort_inputs)
        predictions = ort_outputs[0].tolist()

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
