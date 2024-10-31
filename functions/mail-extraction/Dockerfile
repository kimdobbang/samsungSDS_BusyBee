FROM public.ecr.aws/lambda/python:3.12

# 작업 디렉터리 설정
WORKDIR ${LAMBDA_TASK_ROOT}

# 종속성 설치 (캐시 활용을 위해 requirements.txt만 먼저 복사)
COPY requirements.txt .
RUN pip install -r requirements.txt

# 핸들러 코드 복사
COPY handler.py .

# Lambda 핸들러 설정
CMD ["handler.lambda_handler"]
