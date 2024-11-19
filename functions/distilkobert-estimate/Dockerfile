# Python 3.12 Lambda 이미지를 기반으로 시작
FROM public.ecr.aws/lambda/python:3.12

# 작업 디렉토리 설정
WORKDIR ${LAMBDA_TASK_ROOT}

# 환경 변수 설정
ENV HF_HOME=/tmp/huggingface_cache
ENV TRANSFORMERS_CACHE=/tmp/huggingface_cache
ENV TRANSFORMERS_OFFLINE=1

# 필요 라이브러리 설치
COPY requirements.txt .
RUN pip install -r requirements.txt

# Lambda 핸들러 복사
COPY handler.py .

# Lambda 실행 핸들러 지정
CMD ["handler.lambda_handler"]
