import os
import sys  # Import sys module
import json
import boto3
from transformers import AutoTokenizer, AutoModelForSequenceClassification
import torch
from concurrent.futures import ThreadPoolExecutor

# 환경 변수
S3_BUCKET = os.environ.get("S3_BUCKET")
MODEL_PREFIX = os.environ.get("MODEL_PREFIX")  # 기본 모델 S3 경로
ONNX_MODEL_PREFIX = os.environ.get("ONNX_MODEL_PREFIX")  # ONNX 모델 S3 경로
MODEL_DIR = "/tmp/model"  # Lambda에서 쓰기 가능한 경로
ONNX_FILE = "distilkobert.onnx"
HF_HOME = "/tmp/huggingface"  # Hugging Face 캐시 경로

# 추가된 환경 변수 설정
os.environ["HOME"] = "/tmp"
os.environ["HF_HOME"] = HF_HOME
os.environ["TRANSFORMERS_CACHE"] = HF_HOME
os.environ["XDG_CACHE_HOME"] = "/tmp/.cache"
os.environ["TORCH_HOME"] = "/tmp/.torch"
os.environ["TRANSFORMERS_OFFLINE"] = "1"  # 오프라인 모드 활성화

# S3 클라이언트 생성
s3 = boto3.client("s3")

# S3에서 모델 다운로드
def download_model():
    os.makedirs(MODEL_DIR, exist_ok=True)
    files = [
        "config.json",
        "model.safetensors",
        "vocab.txt",
        "special_tokens_map.json",
        "tokenizer_78b3253a26.model",
        "tokenizer_config.json",
        "tokenization_kobert.py",  # 추가된 파일
    ]

    def download_file(file_name):
        s3_path = f"{MODEL_PREFIX}{file_name}"  # 기본 모델 파일 경로
        local_path = os.path.join(MODEL_DIR, file_name)
        if not os.path.exists(local_path):
            print(f"Downloading {file_name} from S3...")
            s3.download_file(S3_BUCKET, s3_path, local_path)

    with ThreadPoolExecutor() as executor:
        executor.map(download_file, files)

    # Create __init__.py in MODEL_DIR to make it a Python package
    init_file = os.path.join(MODEL_DIR, '__init__.py')
    with open(init_file, 'w') as f:
        pass  # Empty __init__.py
    print("Created __init__.py in MODEL_DIR")

    # Update config.json to include tokenizer_class
    config_path = os.path.join(MODEL_DIR, 'config.json')
    with open(config_path, 'r') as f:
        config = json.load(f)

    # Ensure the tokenizer_class is set to "KoBertTokenizer"
    config['tokenizer_class'] = 'KoBertTokenizer'

    with open(config_path, 'w') as f:
        json.dump(config, f)
    print("Updated config.json with tokenizer_class")

    print("모델 다운로드 완료")

# 모델 및 토크나이저 로드
def load_model():
    print("모델과 토크나이저 로드 중...")

    # sys.path에 MODEL_DIR 추가
    sys.path.insert(0, MODEL_DIR)
    print(f"sys.path: {sys.path}")

    # PYTHONPATH 설정
    os.environ["PYTHONPATH"] = f"{MODEL_DIR}:{os.environ.get('PYTHONPATH', '')}"
    print(f"PYTHONPATH: {os.environ['PYTHONPATH']}")

    # tokenization_kobert.py 파일 확인
    tokenization_path = os.path.join(MODEL_DIR, "tokenization_kobert.py")
    if os.path.exists(tokenization_path):
        print(f"tokenization_kobert.py 파일이 존재합니다: {tokenization_path}")
    else:
        raise FileNotFoundError(f"tokenization_kobert.py 파일이 존재하지 않습니다: {tokenization_path}")

    # 토크나이저 로드
    tokenizer = AutoTokenizer.from_pretrained(
        MODEL_DIR,
        cache_dir=HF_HOME,
        trust_remote_code=True,
        local_files_only=True
    )

    # 모델 로드
    model = AutoModelForSequenceClassification.from_pretrained(
        MODEL_DIR,
        cache_dir=HF_HOME,
        trust_remote_code=True,
        local_files_only=True
    )

    return tokenizer, model

# 모델 재학습
def retrain_model(tokenizer, model, training_data):
    print("모델 재학습 시작")
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

    print("모델 재학습 완료")

    # 모델과 토크나이저 저장 경로 지정
    model.save_pretrained(MODEL_DIR)
    tokenizer.save_pretrained(MODEL_DIR)
    print("모델과 토크나이저 저장 완료")
    return model

# ONNX 변환
def convert_to_onnx(model):
    print("ONNX 변환 시작...")
    onnx_path = os.path.join("/tmp", ONNX_FILE)  # Lambda에서 쓰기 가능한 경로

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

# S3 업로드
def upload_model_files(model_dir):
    """
    기본 모델 파일 업로드 (MODEL_PREFIX 사용)
    """
    model_files = [
        "pytorch_model.bin",  # 모델 저장 형식이 변경될 수 있으므로 추가 확인 필요
        "config.json",
        "vocab.txt",
        "special_tokens_map.json",
        "tokenizer.json",
        "tokenizer_config.json",
    ]
    for file_name in model_files:
        local_path = os.path.join(model_dir, file_name)
        if os.path.exists(local_path):
            s3_key = f"{MODEL_PREFIX}{file_name}"
            s3.upload_file(local_path, S3_BUCKET, s3_key)
            print(f"Uploaded {local_path} to s3://{S3_BUCKET}/{s3_key}")
        else:
            print(f"파일 {local_path}이 존재하지 않습니다.")

def upload_onnx_file(onnx_path):
    """
    ONNX 모델 업로드 (ONNX_MODEL_PREFIX 사용)
    """
    s3_key = f"{ONNX_MODEL_PREFIX}{ONNX_FILE}"
    s3.upload_file(onnx_path, S3_BUCKET, s3_key)
    print(f"Uploaded {onnx_path} to s3://{S3_BUCKET}/{s3_key}")

# Lambda 핸들러
def lambda_handler(event, context):
    try:
        # S3에서 모델 다운로드
        print("모델 다운로드 및 로드 중...")
        download_model()
        tokenizer, model = load_model()

        # 이벤트 데이터 처리
        messages = [json.loads(record["body"]) for record in event.get("Records", [])]
        training_data = [
            {"text": msg["emailContent"], "label": msg["flag"]} for msg in messages
        ]

        if not training_data:
            return {
                "statusCode": 200,
                "body": json.dumps({"message": "No training data found."}),
            }

        # 모델 재학습
        retrained_model = retrain_model(tokenizer, model, training_data)

        # ONNX 변환
        onnx_path = convert_to_onnx(retrained_model)

        # 기본 모델 업로드
        upload_model_files(MODEL_DIR)

        # ONNX 모델 업로드
        upload_onnx_file(onnx_path)

        return {
            "statusCode": 200,
            "body": json.dumps({"message": "Model retrained and uploaded successfully."}),
        }

    except Exception as e:
        print(f"에러 발생: {e}")
        return {"statusCode": 500, "body": json.dumps({"error": str(e)})}
