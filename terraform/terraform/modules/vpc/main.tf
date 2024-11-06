
# VPC 생성
resource "aws_vpc" "vpc" {
  cidr_block = "10.0.0.0/16"
  enable_dns_support   = true
  enable_dns_hostnames = true
  tags = {
    Name = "vpc"
  }
}

# 인터넷 게이트웨이 생성
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.vpc.id
  tags = {
    Name = "igw"
  }
}

# 퍼블릭 서브넷 생성
resource "aws_subnet" "public_subnet" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = "10.0.1.0/24"

  availability_zone = "ap-northeast-2a" # 원하는 가용 영역으로 변경하세요.
  map_public_ip_on_launch = true
  tags = {
    Name = "public-subnet"
  }
}

# 프라이빗 서브넷 생성
resource "aws_subnet" "private_subnet" {
  vpc_id            = aws_vpc.vpc.id
  cidr_block        = "10.0.2.0/24"
  availability_zone = "ap-northeast-2a"  # 원하는 가용 영역으로 변경하세요.
  tags = {
    Name = "private-subnet"
  }
}

# 퍼블릭 라우팅 테이블 생성
resource "aws_route_table" "public_rt" {
  vpc_id = aws_vpc.vpc.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name = "public-rt"
  }
}

# 퍼블릭 서브넷과 라우팅 테이블 연결
resource "aws_route_table_association" "public_rta" {
  subnet_id      = aws_subnet.public_subnet.id
  route_table_id = aws_route_table.public_rt.id
}


# 퍼블릭 서브넷용 보안 그룹
resource "aws_security_group" "public_sg" {
  vpc_id = aws_vpc.vpc.id
  tags = {
    Name = "public-sg"
  }

  # 인바운드 규칙 (예: HTTP 및 HTTPS 트래픽 허용)
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # 모든 IP로부터 HTTP 허용
  }

  ingress {
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # 모든 IP로부터 HTTPS 허용
  }

  # 아웃바운드 규칙 (모든 아웃바운드 트래픽 허용)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

# 프라이빗 서브넷용 보안 그룹
resource "aws_security_group" "private_sg" {
  vpc_id = aws_vpc.vpc.id
  tags = {
    Name = "private-sg"
  }

  # 인바운드 규칙 (예: 퍼블릭 서브넷의 리소스에서 오는 트래픽만 허용)
  ingress {
    from_port       = 3306
    to_port         = 3306
    protocol        = "tcp"
    security_groups = [aws_security_group.public_sg.id]  # 퍼블릭 서브넷에서의 접근 허용
  }

  # 아웃바운드 규칙 (모든 아웃바운드 트래픽 허용)
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}


# 출력 변수 설정 (VPC와 서브넷 ID 출력)
output "vpc_id" {
  value = aws_vpc.vpc.id
}

output "public_subnet_id" {
  value = aws_subnet.public_subnet.id
}

output "private_subnet_id" {
  value = aws_subnet.private_subnet.id
}
