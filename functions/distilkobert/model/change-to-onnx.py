import torch
from transformers import AutoTokenizer, AutoModelForSequenceClassification

# 모델 경로와 파일 설정
model_dir = "./"  # 현재 디렉터리에 모델 파일이 있음
onnx_output_path = "distilkobert.onnx"

# 모델과 토크나이저 로드
tokenizer = AutoTokenizer.from_pretrained(model_dir)
model = AutoModelForSequenceClassification.from_pretrained(model_dir)

# 모델을 평가 모드로 설정
model.eval()

# ONNX 변환을 위한 더미 입력 데이터 생성
dummy_input = {
    "input_ids": torch.ones((1, 128), dtype=torch.int64),
    "attention_mask": torch.ones((1, 128), dtype=torch.int64),
}

# PyTorch 모델을 ONNX로 변환
torch.onnx.export(
    model,  # PyTorch 모델
    (dummy_input["input_ids"], dummy_input["attention_mask"]),  # 입력
    onnx_output_path,  # 변환된 ONNX 파일 저장 경로
    input_names=["input_ids", "attention_mask"],  # 입력 이름
    output_names=["logits"],  # 출력 이름
    dynamic_axes={
        "input_ids": {0: "batch_size"},  # 가변 배치 크기 지원
        "attention_mask": {0: "batch_size"},
    },
    opset_version=11,  # ONNX opset 버전
)
print(f"ONNX 모델 변환 완료: {onnx_output_path}")
