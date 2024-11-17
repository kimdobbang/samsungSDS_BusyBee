# Python 3.12 Lambda 이미지를 베이스로 사용
FROM public.ecr.aws/lambda/python:3.12

# 작업 디렉터리 설정
WORKDIR ${LAMBDA_TASK_ROOT}

# 환경 변수 설정
ENV HF_HOME=/tmp/huggingface
ENV TRANSFORMERS_CACHE=/tmp/huggingface
ENV TRANSFORMERS_OFFLINE=1
ENV PYTHONPATH=${LAMBDA_TASK_ROOT}/tokenizer

# tokenization_kobert.py 복사
COPY tokenization_kobert.py ${LAMBDA_TASK_ROOT}/model/tokenization_kobert.py

# 종속성 설치
COPY requirements.txt .
RUN pip install -r requirements.txt

# 핸들러 코드 복사
COPY handler.py .

# Lambda 핸들러 설정
CMD ["handler.lambda_handler"]
