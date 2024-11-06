module "sqs_module" {
  source = "./modules/request-mail"
}

module "classfication_module" {
    source = "./modules/classification"
}

module "information_verification" {
  source = "./modules/information_verification"
}

module "chat" {
  source = "./modules/chat"
}

module "vpc" {
  source = "./modules/vpc"
}

module "ses" {
  source = "./modules/ses"
}

module "route53" {
  source = "./modules/route53"
}

module "cognito_pool" {
  source = "./modules/coginito"
}

module "ssm" {
  source = "./modules/ssm"
}
