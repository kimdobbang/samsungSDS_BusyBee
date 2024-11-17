import os
import sys
import json
import boto3
import torch
from transformers import AutoModelForSequenceClassification
from concurrent.futures import ThreadPoolExecutor

# 환경 변수 설정
S3_BUCKET = os.environ.get("S3_BUCKET")
MODEL_PREFIX = os.environ.get("MODEL_PREFIX")  # 모델 파일 S3 경로
ONNX_MODEL_PREFIX = os.environ.get("ONNX_MODEL_PREFIX")  # ONNX 모델 S3 경로
MODEL_DIR = "/tmp/model"  # Lambda 내 쓰기 가능한 경로
ONNX_FILE = "distilkobert.onnx"
HF_HOME = "/tmp/huggingface"

# 캐시 경로 및 오프라인 모드 활성화
os.environ["HOME"] = "/tmp"
os.environ["HF_HOME"] = HF_HOME
os.environ["TRANSFORMERS_CACHE"] = HF_HOME
os.environ["TRANSFORMERS_OFFLINE"] = "1"  # 오프라인 모드

# S3 클라이언트 생성
s3 = boto3.client("s3")
lambda_client = boto3.client("lambda")


# S3에서 필요한 모델 파일 다운로드
def download_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    files = [
        "model.safetensors",  # 학습 후 변경될 수 있는 가중치 파일
        "config.json",        # 모델 설정 파일
        "vocab.txt",          # 필수
        "special_tokens_map.json",  # 필수
        "tokenizer_78b3253a26.model",  # 실제 사용될 토크나이저
        "tokenizer_config.json",  # 필수
        "tokenization_kobert.py"  # 추가된 부분
    ]

    def download_file(file_name):
        s3_path = f"{MODEL_PREFIX}{file_name}"
        local_path = os.path.join(MODEL_DIR, file_name)
        if not os.path.exists(local_path):
            print(f"Downloading {file_name} from S3...")
            try:
                s3.download_file(S3_BUCKET, s3_path, local_path)
                print(f"Successfully downloaded {file_name} to {local_path}")
            except Exception as e:
                print(f"Error downloading {file_name} from S3: {e}")
                raise

    with ThreadPoolExecutor() as executor:
        executor.map(download_file, files)

    print(f"모델 다운로드 완료. 다운로드된 파일: {os.listdir(MODEL_DIR)}")


# 모델 및 토크나이저 로드
def load_model():
    print("모델 및 토크나이저 로드 중...")
    print(f"다운로드된 파일: {os.listdir(MODEL_DIR)}")

    # PYTHONPATH 설정
    sys.path.insert(0, MODEL_DIR)

    # tokenization_kobert.py 파일 확인
    tokenization_path = os.path.join(MODEL_DIR, "tokenization_kobert.py")
    if os.path.exists(tokenization_path):
        print(f"tokenization_kobert.py 파일 확인 완료: {tokenization_path}")
    else:
        raise FileNotFoundError(f"tokenization_kobert.py 파일이 누락되었습니다: {tokenization_path}")

    # 커스텀 토크나이저 임포트
    try:
        from tokenization_kobert import KoBertTokenizer
        print("KoBertTokenizer 클래스 임포트 완료.")
    except Exception as e:
        print(f"KoBertTokenizer 임포트 중 에러 발생: {e}")
        raise

    # 토크나이저 로드
    try:
        tokenizer = KoBertTokenizer.from_pretrained(MODEL_DIR)
        print(f"토크나이저 로드 완료: {tokenizer}")
    except Exception as e:
        print(f"토크나이저 로드 중 에러 발생: {e}")
        raise

    # 모델 로드
    try:
        model = AutoModelForSequenceClassification.from_pretrained(
            MODEL_DIR,
            cache_dir=HF_HOME,
            local_files_only=True,
            trust_remote_code=True
        )
        print("모델 로드 완료.")
    except Exception as e:
        print(f"모델 로드 중 에러 발생: {e}")
        raise

    print("모델 및 토크나이저 로드 완료.")
    return tokenizer, model
    
# 모델 저장
def retrain_model(tokenizer, model, training_data):
    print("모델 재학습 시작...")
    inputs = tokenizer(
        [data["text"] for data in training_data],
        return_tensors="pt",
        padding=True,
        truncation=True,
        max_length=128,
    )
    labels = torch.tensor([data["label"] for data in training_data])

    dataset = torch.utils.data.TensorDataset(
        inputs["input_ids"], inputs["attention_mask"], labels
    )
    dataloader = torch.utils.data.DataLoader(dataset, batch_size=32)

    model.train()
    optimizer = torch.optim.AdamW(model.parameters(), lr=5e-5)

    for epoch in range(1):  # 에포크 수 설정
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

    print("모델 재학습 완료.")

    # 모델 저장
    print("모델 저장 중...")
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_vocabulary(MODEL_DIR)  # save_pretrained 대신 save_vocabulary 사용
    print("모델 저장 완료.")

    return model


# ONNX 변환
def convert_to_onnx(model):
    print("ONNX 변환 시작...")
    onnx_path = os.path.join("/tmp", ONNX_FILE)

    dummy_input = {
        "input_ids": torch.ones((1, 128), dtype=torch.int64),
        "attention_mask": torch.ones((1, 128), dtype=torch.int64),
    }

    torch.onnx.export(
        model,
        (dummy_input["input_ids"], dummy_input["attention_mask"]),
        onnx_path,
        input_names=["input_ids", "attention_mask"],
        output_names=["logits"],
        dynamic_axes={
            "input_ids": {0: "batch_size"},
            "attention_mask": {0: "batch_size"},
        },
        opset_version=14,
    )
    print(f"ONNX 모델 저장 완료: {onnx_path}")
    return onnx_path


# S3로 모델 업로드
def upload_model_files(model_dir):
    files = [
        "model.safetensors",  # 변경된 가중치 파일
        "config.json",        # 설정 파일
    ]
    for file_name in files:
        local_path = os.path.join(model_dir, file_name)
        if os.path.exists(local_path):
            s3_path = f"{MODEL_PREFIX}{file_name}"
            try:
                s3.upload_file(local_path, S3_BUCKET, s3_path)
                print(f"Uploaded {file_name} to s3://{S3_BUCKET}/{s3_path}")
            except Exception as e:
                print(f"Error uploading {file_name} to S3: {e}")
                raise


def upload_onnx_file(onnx_path):
    s3_path = f"{ONNX_MODEL_PREFIX}{ONNX_FILE}"
    try:
        s3.upload_file(onnx_path, S3_BUCKET, s3_path)
        print(f"Uploaded ONNX 모델: s3://{S3_BUCKET}/{s3_path}")
    except Exception as e:
        print(f"Error uploading ONNX model to S3: {e}")
        raise


# Lambda 핸들러
def lambda_handler(event, context):
    try:
        print("Lambda 핸들러 시작.")

        # 모델 파일 다운로드
        download_model()

        # 모델 및 토크나이저 로드
        tokenizer, model = load_model()

        # 이벤트 데이터 처리
        messages = [json.loads(record["body"]) for record in event.get("Records", [])]
        training_data = []
        for msg in messages:
            flag = msg.get("flag")
            if flag is None or not (1 <= flag <= 4):
                raise ValueError(f"Invalid flag value: {flag}")
            training_data.append({"text": msg["emailContent"], "label": flag - 1})

        if not training_data:
            return {"statusCode": 200, "body": json.dumps({"message": "No training data."})}

        print(f"Received training data: {training_data}")

        # 모델 재학습
        retrained_model = retrain_model(tokenizer, model, training_data)

        # ONNX 변환
        onnx_path = convert_to_onnx(retrained_model)

        # 변경된 모델 업로드
        upload_model_files(MODEL_DIR)
        upload_onnx_file(onnx_path)

        # 평가 람다 호출
        invoke_evaluation_lambda()

        return {"statusCode": 200, "body": json.dumps({"message": "Success"})}

    except Exception as e:
        print(f"에러 발생: {e}")
        import traceback
        traceback.print_exc()
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
        
def invoke_evaluation_lambda():
    """
    디스틸버트 평가 람다 호출
    """
    evaluation_lambda_name = "distilkobert-evaluation"  # 평가 람다의 이름
    payload = {
        "httpMethod": "POST",  # 평가 람다가 POST 요청으로 작동
        "body": {}  # 추가적인 데이터가 필요하다면 여기에 추가
    }

    try:
        print("평가 람다 호출 시작...")
        response = lambda_client.invoke(
            FunctionName=evaluation_lambda_name,
            InvocationType="RequestResponse",  # 동기 호출
            Payload=json.dumps(payload),
        )
        response_payload = json.loads(response["Payload"].read())
        print(f"평가 람다 호출 성공: {response_payload}")
    except Exception as e:
        print(f"평가 람다 호출 중 에러 발생: {e}")
        raise