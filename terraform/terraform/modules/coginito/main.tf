# resource "aws_cognito_user_pool_domain" "main" {
#   domain       = "busybeemail"  # "https://"를 제외하고, 서브도메인만 입력
#   user_pool_id = aws_cognito_user_pool.cognito_pool.id
# }

# resource "aws_cognito_user_pool" "cognito_pool" {
#   name = "cognito_pool"

#   # 비밀번호 정책 설정
#   password_policy {
#     minimum_length    = 8
#     require_lowercase = true
#     require_uppercase = true
#     require_numbers   = true
#     require_symbols   = true
#   }

#   # MFA 설정 (선택 사항)
#   mfa_configuration = "OPTIONAL"
#   software_token_mfa_configuration {
#     enabled = false
#   }

#   # 이메일 인증 옵션
#   auto_verified_attributes = ["email"]
# }

# resource "aws_cognito_user_pool_client" "app_client" {
#   name            = "app_client"
#   user_pool_id    = aws_cognito_user_pool.cognito_pool.id
#   generate_secret = false

#   # 허용된 콜백 URL 설정
#   callback_urls = [
#     "https://busybeemail.net",
#   ]
# }


resource "aws_cognito_user_pool" "cognito_pool" {
  name = "cognito_pool"

  # 비밀번호 정책 설정
  password_policy {
    minimum_length    = 8
    require_lowercase = true
    require_uppercase = true
    require_numbers   = true
    require_symbols   = true
  }

  # MFA 설정 (선택 사항)
  mfa_configuration = "OPTIONAL"
  software_token_mfa_configuration {
    enabled = false
  }

  # 이메일 인증 옵션
  auto_verified_attributes = ["email"]
}

resource "aws_cognito_user_pool_domain" "main" {
  domain       = "busybeemail-unique"  # 고유한 도메인 이름
  user_pool_id = aws_cognito_user_pool.cognito_pool.id
}

resource "aws_cognito_user_pool_client" "app_client" {
  name                      = "app_client"
  user_pool_id             = aws_cognito_user_pool.cognito_pool.id
  generate_secret          = false

  # 허용된 콜백 URL 및 로그아웃 URL 설정
  callback_urls = [
    "https://busybeemail.net/callback",  # 콜백 URL
  ]
  logout_urls = [
    "https://busybeemail.net/logout",  # 로그아웃 URL
  ]

  # OAuth 설정
  allowed_oauth_flows       = ["implicit", "code"]  # 암시적 권한 부여 추가
  allowed_oauth_scopes      = ["email", "openid", "profile"]
  allowed_oauth_flows_user_pool_client = true
  supported_identity_providers = ["COGNITO"]
}