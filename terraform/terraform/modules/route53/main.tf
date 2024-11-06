resource "aws_route53_zone" "my_zone" {
  name = "busybeemail.net"
}

resource "aws_route53_record" "mail" {
  zone_id = aws_route53_zone.my_zone.zone_id
  name     = "busybeemail.net"
  type     = "MX"
  ttl      = 300
  records  = ["10 inbound-smtp.ap-northeast-2.amazonaws.com"]
}

resource "aws_route53_record" "dmarc" {
  zone_id = aws_route53_zone.my_zone.zone_id
  name     = "_dmarc.busybeemail.net"
  type     = "TXT"
  ttl      = 300
  records  = ["v=DMARC1; p=none;"]
}

resource "aws_route53_record" "spf" {
  zone_id = aws_route53_zone.my_zone.zone_id
  name     = "busybeemail.net"
  type     = "TXT"
  ttl      = 300
  records  = ["v=spf1 include:amazonses.com ~all"]
}
