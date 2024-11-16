import boto3
import os

# S3 버킷 및 경로
s3_bucket = "sagemaker-ap-northeast-2-481665114066"
model_prefix = "distilkobert-onxx/"

# 업로드할 파일 목록
files_to_upload = [
    "distilkobert.onnx",
    "config.json",
    "vocab.txt",
]

# S3 클라이언트 생성
s3 = boto3.client("s3")

# 파일 업로드
for file_name in files_to_upload:
    s3.upload_file(
        file_name,
        s3_bucket,
        f"{model_prefix}{file_name}"
    )
    print(f"업로드 완료: s3://{s3_bucket}/{model_prefix}{file_name}")
