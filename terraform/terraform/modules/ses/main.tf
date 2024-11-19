resource "aws_ses_domain_identity" "domain_identity" {
  domain = "busybeemail.net"  # 본인의 도메인으로 변경
}


resource "aws_ses_receipt_rule_set" "rule_set" {
  rule_set_name = "mail_rule_set"
}

resource "aws_ses_receipt_rule" "email_rule" {
  rule_set_name = aws_ses_receipt_rule_set.rule_set.rule_set_name
  name          = "s3_mail_rule"
  enabled       = true
  recipients    = []  # 수신할 이메일 주소 또는 도메인 지정

  s3_action {
      bucket_name = "request-mail"  # 실제 S3 버킷 이름으로 변경
      object_key_prefix = "mails/"  # 저장할 폴더 경로 (선택 사항)
      kms_key_arn = null             # KMS 키 ARN 설정 (암호화가 필요한 경우에만 사용)
      position    = 1
      topic_arn   = null             # 알림이 필요할 경우 SNS 주제 ARN을 설정 가능
   }

  # 수신 거부 규칙 (선택 사항)
  scan_enabled = true
  tls_policy   = "Optional"
}

resource "aws_iam_policy" "ses_s3" {
  name        = "ses"
  description = "Policy to allow SES to save emails to S3"
  
  policy = jsonencode({
    Version = "2012-10-17",
    Statement = [
      {
        Action = [
          "s3:*",
          "s3-object-lambda:*",
          "s3:PutObject",
          "s3:PutObjectAcl"
        ],
        Effect   = "Allow",
        Resource = "arn:aws:s3:::request-mail/*"   # 실제 S3 버킷 이름으로 변경
      }
    ]
  })
}

resource "aws_iam_role" "ses_s3_roles" {
  name = "ses_s3_roles"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action    = "sts:AssumeRole"
        Principal = {
          Service = "ses.amazonaws.com"
        }
        Effect    = "Allow"
        Sid       = ""
      },
    ]
  })
}


resource "aws_iam_role_policy_attachment" "ses_s3_attachment" {
  policy_arn = aws_iam_policy.ses_s3.arn
  role       = aws_iam_role.ses_s3_roles.name
}

# ## route53에 cname 등록
# module "route53_zone" {
#   source = "../route53"  # 실제 경로로 변경
# }


# resource "aws_route53_record" "ses_verification" {
#   zone_id = module.route53_zone.zone_id
#   name    = "${aws_ses_domain_identity.domain_identity.domain}_domainkey.busybeemail.net"  # SES에서 제공하는 Name 값
#   type    = "CNAME"
#   ttl     = 300

#   records = [
#     "CNAME_record_value_from_SES"  # SES에서 제공하는 Value 값으로 변경
#   ]
# }