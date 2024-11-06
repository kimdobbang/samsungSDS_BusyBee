# S3 버킷 생성 - 공용 접근 제거
resource "aws_s3_bucket" "front_bucket" {
  bucket = "modomail-bucket"
  website {
    index_document = "index.html"
    error_document = "index.html"
  }

  tags = {
    Name = "ReactAppBucket"
  }
}


# CloudFront Origin Access Identity
resource "aws_cloudfront_origin_access_identity" "origin_identity" {
  comment = "Access identity for React app S3 bucket"
}

# CloudFront 배포 생성
resource "aws_cloudfront_distribution" "front_distribution" {
  origin {
    domain_name = aws_s3_bucket.front_bucket.bucket_regional_domain_name
    origin_id   = "S3-origin-react-app"

    s3_origin_config {
      origin_access_identity = aws_cloudfront_origin_access_identity.origin_identity.cloudfront_access_identity_path
    }
  }

  enabled             = true
  is_ipv6_enabled     = true
  default_root_object = "index.html"

  default_cache_behavior {
    allowed_methods  = ["GET", "HEAD", "OPTIONS"]
    cached_methods   = ["GET", "HEAD"]
    target_origin_id = "S3-origin-react-app"

    forwarded_values {
      query_string = false
      cookies {
        forward = "none"
      }
    }

    viewer_protocol_policy = "redirect-to-https"
    min_ttl                = 0
    default_ttl            = 3600
    max_ttl                = 86400
  }

  price_class = "PriceClass_100"

  # 대체 도메인 이름 설정
  aliases = ["busybeemail.net"]  # 대체 도메인 이름을 설정

  # SSL 인증서 설정 (ACM에서 발급받은 인증서 ARN으로 변경)
  viewer_certificate {
    acm_certificate_arn = "arn:aws:acm:us-east-1:481665114066:certificate/f21657b1-4e4d-4cbb-9c3f-99c356350c24"  # ACM에서 발급받은 SSL 인증서 ARN
    ssl_support_method  = "sni-only"
  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  tags = {
    Name = "ReactAppDistribution"
  }
}


# S3 버킷 정책 - CloudFront OAI 접근만 허용
resource "aws_s3_bucket_policy" "react_app_bucket_policy" {
  bucket = aws_s3_bucket.front_bucket.id

  policy = jsonencode({
    Version = "2012-10-17",
    Id      = "http referer policy example",
    Statement = [
      {
        Sid       = "Stmt1730795456871",
        Effect    = "Allow",
        Principal = "*",
        Action    = ["s3:GetObject"],
        Resource  = "arn:aws:s3:::modomail-bucket/*"
      }
    ]
  })
}


# Route53 레코드 설정
resource "aws_route53_record" "front_record" {
  zone_id = aws_route53_zone.my_zone.zone_id
  name    = "www.busybeemail.net"  # 본인의 서브도메인으로 변경
  type    = "A"

  alias {
    name                   = aws_cloudfront_distribution.front_distribution.domain_name
    zone_id                = aws_cloudfront_distribution.front_distribution.hosted_zone_id
    evaluate_target_health = false
  }
}
