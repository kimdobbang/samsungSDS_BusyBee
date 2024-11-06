## sqs
resource "aws_sqs_queue" "file_classification_trigger" {
  name = "file-classification-trigger"
}

resource "aws_sqs_queue" "mail_classfication_trigger" {
  name = "mail-classfication-trigger"
}

resource "aws_sqs_queue" "text_extraction_trigger" {
  name = "text-extraction-trigger"
}

##s3
resource "aws_s3_bucket" "request_mail" {
    bucket = "request-mail"
    force_destroy = true
    tags = {
      environment = "devel"
    }
}

## ecr
resource "aws_ecr_repository" "mail_classfication" {
    name = "mail-classfication"
    image_tag_mutability = "MUTABLE"
}


resource "aws_s3_bucket_public_access_block" "public_access_block" {
  bucket = aws_s3_bucket.request_mail.id

  block_public_acls       = false
  block_public_policy     = false
  ignore_public_acls      = false
  restrict_public_buckets = false 
}

resource "aws_s3_bucket_policy" "bucket_policy" {
  bucket = aws_s3_bucket.request_mail.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid       = "AllowSESToPutEmails",  # SES가 이메일을 PUT할 수 있도록 허용
        Effect    = "Allow",
        Principal = {
          Service = "ses.amazonaws.com"
        },
        Action    = [
          "s3:PutObject",
          "s3:PutObjectAcl",
        ],
        Resource  = "${aws_s3_bucket.request_mail.arn}/*"  # 버킷 내 모든 객체에 대한 접근 허용
      },
      {
        Sid       = "PublicRead",
        Effect    = "Allow",
        Principal = "*",
        Action    = "s3:GetObject",
        Resource  = "${aws_s3_bucket.request_mail.arn}/*"  # 버킷 내 모든 객체에 대한 읽기 권한
      },
    ]
  })
}

resource "aws_s3_bucket_notification" "mail_classfication_trigger_notification" {
  bucket = aws_s3_bucket.request_mail.id

  queue {
    queue_arn = aws_sqs_queue.file_classification_trigger.arn
    events    = ["s3:ObjectCreated:*"] # 생성된 모든 객체에 대한 이벤트 전송
  }
}

# s3가 sqs 대기열 들기 
resource "aws_sqs_queue_policy" "s3_to_sqs_policy" {
  queue_url = aws_sqs_queue.file_classification_trigger.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Principal = {
          Service = "s3.amazonaws.com"
        }
        Action = "SQS:SendMessage"
        Resource = aws_sqs_queue.file_classification_trigger.arn
        Condition = {
          ArnLike = {
            "aws:SourceArn" = aws_s3_bucket.request_mail.arn
          }
        }
      }
    ]
  })
}