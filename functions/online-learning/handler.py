import boto3
import json
import os
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch

# 환경 변수
S3_BUCKET = os.environ.get("S3_BUCKET", "sagemaker-ap-northeast-2-481665114066")
MODEL_PREFIX = os.environ.get("MODEL_PREFIX", "distilkobert-classifier/")
MODEL_DIR = "/tmp/model"

# S3 및 DynamoDB 클라이언트 생성
s3 = boto3.client("s3")
dynamodb = boto3.resource("dynamodb")

# DynamoDB 테이블 이름 설정
DYNAMODB_TABLE = "mail-db"

# S3에서 모델 다운로드
def download_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    files = ["config.json", "pytorch_model.bin", "vocab.txt"]
    for file_name in files:
        s3.download_file(
            S3_BUCKET,
            f"{MODEL_PREFIX}{file_name}",
            os.path.join(MODEL_DIR, file_name),
        )
    print("모델 다운로드 완료")

# 모델 및 토크나이저 로드
def load_model():
    tokenizer = AutoTokenizer.from_pretrained(MODEL_DIR)
    model = AutoModelForSequenceClassification.from_pretrained(MODEL_DIR)
    return tokenizer, model

# 모델 업로드
def upload_model_to_s3():
    print("Uploading model to S3...")
    model_files = ["pytorch_model.bin", "config.json", "vocab.txt"]
    for file_name in model_files:
        s3.upload_file(
            os.path.join(MODEL_DIR, file_name), 
            S3_BUCKET, 
            f"{MODEL_PREFIX}{file_name}"
        )
    print("모델 업로드 완료")

# Lambda 핸들러
def lambda_handler(event, context):
    try:
        # S3에서 모델 다운로드 및 로드
        download_model()
        tokenizer, model = load_model()

        # SQS 메시지 읽기
        messages = []
        for record in event["Records"]:
            body = json.loads(record["body"])
            messages.append(body)
        
        # 학습 데이터 준비
        training_data = [
            {"text": msg["emailContent"], "label": msg["flag"]}
            for msg in messages
            if "emailContent" in msg and "flag" in msg
        ]
        
        if not training_data:
            print("학습할 데이터가 없습니다.")
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "No training data found."}),
            }

        # 학습 수행
        retrain_model(tokenizer, model, training_data)

        # 업데이트된 모델 S3에 업로드
        upload_model_to_s3()

        return {
            "statusCode": 200,
            "body": json.dumps(
                {"message": f"Successfully processed {len(training_data)} training samples."}
            ),
        }
    except Exception as e:
        print(f"에러 발생: {e}")
        return {
            "statusCode": 500,
            "body": json.dumps({"error": str(e)}),
        }

# 모델 재학습
def retrain_model(tokenizer, model, training_data):
    print("모델 재학습 시작")
    
    # 학습 데이터 토큰화
    inputs = tokenizer(
        [data["text"] for data in training_data],
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128,
    )
    labels = torch.tensor([data["label"] for data in training_data])

    # 학습 데이터 생성
    dataset = torch.utils.data.TensorDataset(
        inputs["input_ids"], inputs["attention_mask"], labels
    )
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=16)

    # 모델 학습 준비
    model.train()
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)

    # 간단한 학습 루프 (에포크 1회 실행)
    for epoch in range(1):
        for batch in dataloader:
            input_ids, attention_mask, batch_labels = batch
            outputs = model(
                input_ids=input_ids,
                attention_mask=attention_mask,
                labels=batch_labels,
            )
            loss = outputs.loss
            loss.backward()
            optimizer.step()
            optimizer.zero_grad()
            print(f"Loss: {loss.item()}")

    # 모델 저장
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)
    print("모델 재학습 완료 및 저장 완료")
