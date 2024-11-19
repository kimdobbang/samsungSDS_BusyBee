resource "aws_sqs_queue" "chat_quotation_calculation_trigger" {
  name = "chat-quotation-calculation-trigger"
}

resource "aws_dynamodb_table" "chat_sessions" {
  name         = "chat-app-CustomerChatSessions"
  billing_mode = "PAY_PER_REQUEST"

  # 테이블 키와 속성을 정확히 입력해야 합니다.
  hash_key     = "orderId"  # 실제 테이블의 파티션 키 이름으로 변경

  attribute {
    name = "orderId"        # 파티션 키 이름
    type = "S"                          # 파티션 키 유형 (예: S = String, N = Number)
  }

}