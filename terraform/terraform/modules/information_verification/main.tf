#sqs
resource "aws_sqs_queue" "quotation_calculation_trigger" {
    name = "quotation-calculation-trigger" 
}

## dynamodb
resource "aws_dynamodb_table" "example_table" {
  name           = "estimate"             
  billing_mode   = "PROVISIONED"               
  read_capacity  = 5                           
  write_capacity = 5                         
  hash_key       = "Id"                       

  attribute {
    name = "Id"                                
    type = "S"                                 
  }

  # 태그 추가 (선택 사항)
  tags = {
    Environment = "dev"
  }
}

## ecr
resource "aws_ecr_repository" "information_intergrity_verification" {
    name = "information-intergrity-verification"
    image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "quotation_calculation" {
    name = "quotation-calculation"
    image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "save_data" {
  name = "save-data"
  image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "send_quote_email" {
    name = "send-quote-mail"
    image_tag_mutability = "MUTABLE"
}

resource "aws_ecr_repository" "information_mail_request" {
    name = "information-mail-request"
    image_tag_mutability = "MUTABLE"
}


## sns sqs 연결 모듈 
## 정보 검증 성공
module "save_data" {
  source  = "terraform-aws-modules/sns/aws"
  version = ">= 5.0"

  name = "save-data"

  topic_policy_statements = {
    sqs = {
      sid       = "SQSSubscribe"
      actions   = ["sns:Subscribe", "sns:Receive"]
      principals = [{
        type        = "AWS"
        identifiers = ["*"]
      }]
      conditions = [{
        test     = "StringLike"
        variable = "sns:Endpoint"
        values   = [module.save_data_sqs.queue_arn, module.send_quote_mail_sqs.queue_arn]
      }]
    }
  }

  subscriptions = {
    save_data_sqs = {
      protocol = "sqs"
      endpoint = module.save_data_sqs.queue_arn
    }
    send_quote_mail_sqs = {
      protocol = "sqs"
      endpoint = module.send_quote_mail_sqs.queue_arn
    }
  }

  tags = {
    Environment = "dev"
  }
}

module "save_data_sqs" {
  source = "terraform-aws-modules/sqs/aws"

  name = "save-data-trigger"

  create_queue_policy = true
  queue_policy_statements = {
    sns = {
      sid     = "SNSPublish"
      actions = ["sqs:SendMessage"]

      principals = [
        {
          type        = "Service"
          identifiers = ["sns.amazonaws.com"]
        }
      ]

      conditions = [{
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [module.save_data.topic_arn]
      }]
    }
  }

  tags = {
    Environment = "dev"
  }
}

module "send_quote_mail_sqs" {
  source = "terraform-aws-modules/sqs/aws"

  name = "send-quote-mail-trigger"

  create_queue_policy = true
  queue_policy_statements = {
    sns = {
      sid     = "SNSPublish"
      actions = ["sqs:SendMessage"]

      principals = [
        {
          type        = "Service"
          identifiers = ["sns.amazonaws.com"]
        }
      ]

      conditions = [{
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [module.save_data.topic_arn]
      }]
    }
  }

  tags = {
    Environment = "dev"
  }
}

## 정보 검증 실패 
module "incorrect_information" {
  source  = "terraform-aws-modules/sns/aws"
  version = ">= 5.0"

  name = "incorrect-information"

  topic_policy_statements = {
    sqs = {
      sid       = "SQSSubscribe"
      actions   = ["sns:Subscribe", "sns:Receive"]
      principals = [{
        type        = "AWS"
        identifiers = ["*"]
      }]
      conditions = [{
        test     = "StringLike"
        variable = "sns:Endpoint"
        values   = [module.save_incorrect_information_sqs.queue_arn, module.information_mail_request_sqs.queue_arn]
      }]
    }
  }

  subscriptions = {
    save_incorrect_information_sqs = {
      protocol = "sqs"
      endpoint = module.save_incorrect_information_sqs.queue_arn
    }
    information_mail_request_sqs = {
      protocol = "sqs"
      endpoint = module.information_mail_request_sqs.queue_arn
    }
  }

  tags = {
    Environment = "dev"
  }
}

module "save_incorrect_information_sqs" {
  source = "terraform-aws-modules/sqs/aws"

  name = "save-incorrect-information-trigger"

  create_queue_policy = true
  queue_policy_statements = {
    sns = {
      sid     = "SNSPublish"
      actions = ["sqs:SendMessage"]

      principals = [
        {
          type        = "Service"
          identifiers = ["sns.amazonaws.com"]
        }
      ]

      conditions = [{
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [module.incorrect_information.topic_arn]
      }]
    }
  }

  tags = {
    Environment = "dev"
  }
}

module "information_mail_request_sqs" {
  source = "terraform-aws-modules/sqs/aws"

  name = "information-mail-request-trigger"

  create_queue_policy = true
  queue_policy_statements = {
    sns = {
      sid     = "SNSPublish"
      actions = ["sqs:SendMessage"]

      principals = [
        {
          type        = "Service"
          identifiers = ["sns.amazonaws.com"]
        }
      ]

      conditions = [{
        test     = "ArnEquals"
        variable = "aws:SourceArn"
        values   = [module.incorrect_information.topic_arn]
      }]
    }
  }

  tags = {
    Environment = "dev"
  }
}
