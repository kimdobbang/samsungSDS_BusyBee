#sqs
resource "aws_sqs_queue" "mail_classfication_trigger" {
  name = "mail-classfication-trigger"
}

resource "aws_sqs_queue" "mail_extraction_trigger" {
  name = "mail-extraction-trigger"
}

resource "aws_sqs_queue" "information_intergrity_verification_trigger" {
  name = "information-integrity-verification-trigger"
}

#ecr
resource "aws_ecr_repository" "mail_extraction" {
  name = "mail-extraction"
  image_tag_mutability = "MUTABLE"
}