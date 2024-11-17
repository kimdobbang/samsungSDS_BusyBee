import os
import json
import uuid
import boto3
import numpy as np
import onnxruntime as ort
from transformers import AutoTokenizer
from datetime import datetime

# 환경 변수
S3_BUCKET = os.environ["S3_BUCKET"]
MODEL_PREFIX = os.environ["MODEL_PREFIX"]
TEST_DATA_PREFIX = os.environ["TEST_DATA_PREFIX"]
DYNAMODB_TABLE = os.environ["DYNAMODB_TABLE"]

# DynamoDB 및 S3 클라이언트 생성
dynamodb = boto3.resource("dynamodb")
s3_client = boto3.client("s3")

# 모델 디렉토리 설정
MODEL_DIR = "/tmp/model"
TEST_DATA_FILE = "/tmp/test_dataset.json"
os.makedirs(MODEL_DIR, exist_ok=True)

# S3에서 모델 및 데이터 다운로드
def download_from_s3(prefix, local_dir):
    files = ["config.json", "distilkobert.onnx", "vocab.txt"]
    for file_name in files:
        s3_client.download_file(S3_BUCKET, f"{prefix}{file_name}", os.path.join(local_dir, file_name))

def download_test_dataset():
    s3_client.download_file(S3_BUCKET, TEST_DATA_PREFIX, TEST_DATA_FILE)

# 모델 및 토크나이저 로드
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    ort_session = ort.InferenceSession(os.path.join(MODEL_DIR, "distilkobert.onnx"))
    return tokenizer, ort_session

# 평가 수행
def evaluate_model(tokenizer, ort_session, test_data):
    texts = [item["text"] for item in test_data]
    true_labels = [item["label"] for item in test_data]

    # 데이터 토큰화
    inputs = tokenizer(
        texts,
        return_tensors="np",
        padding="max_length",
        truncation=True,
        max_length=128
    )

    # 모델 추론
    ort_inputs = {
        ort_session.get_inputs()[0].name: inputs["input_ids"],
        ort_session.get_inputs()[1].name: inputs["attention_mask"]
    }
    ort_outputs = ort_session.run(None, ort_inputs)
    predicted_labels = np.argmax(ort_outputs[0], axis=1).tolist()

    # 정확도 계산
    correct = sum(p == t for p, t in zip(predicted_labels, true_labels))
    accuracy = correct / len(true_labels) if true_labels else 0.0

    # 혼동행렬 계산
    num_classes = max(max(true_labels), max(predicted_labels)) + 1
    confusion_matrix = [[0] * num_classes for _ in range(num_classes)]
    for t, p in zip(true_labels, predicted_labels):
        confusion_matrix[t][p] += 1

    return {
        "accuracy": accuracy,
        "confusion_matrix": confusion_matrix,
        "true_labels": true_labels,
        "predicted_labels": predicted_labels
    }

# Lambda 핸들러
def lambda_handler(event, context):
    try:
        # httpMethod가 없으면 기본적으로 POST로 처리
        http_method = event.get("httpMethod", "POST")

        if http_method == "POST":
            # 모델 및 데이터 다운로드
            download_from_s3(MODEL_PREFIX, MODEL_DIR)
            download_test_dataset()

            # 모델 및 데이터 로드
            tokenizer, ort_session = load_model()
            with open(TEST_DATA_FILE, "r", encoding="utf-8") as f:
                test_data = json.load(f)

            # 평가 수행
            results = evaluate_model(tokenizer, ort_session, test_data)

            # 결과 저장
            table = dynamodb.Table(DYNAMODB_TABLE)
            evaluation_id = str(uuid.uuid4())
            table.put_item(Item={
                "id": evaluation_id,
                "timestamp": datetime.utcnow().isoformat(),
                "accuracy": results["accuracy"],
                "confusion_matrix": json.dumps(results["confusion_matrix"]),
                "true_labels": json.dumps(results["true_labels"]),
                "predicted_labels": json.dumps(results["predicted_labels"]),
            })

            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Evaluation completed", "evaluation_id": evaluation_id})
            }

        elif http_method == "GET":
            # DB에서 모든 평가 결과 반환
            table = dynamodb.Table(DYNAMODB_TABLE)
            response = table.scan()
            items = response.get("Items", [])

            return {
                "statusCode": 200,
                "body": json.dumps({"message": "Evaluation results retrieved", "results": items})
            }

        else:
            return {
                "statusCode": 400,
                "body": json.dumps({"message": "Invalid HTTP method"})
            }

    except Exception as e:
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)})
        }
