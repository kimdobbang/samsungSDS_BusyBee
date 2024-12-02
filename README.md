# Busy Bee

---

![표지.png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2Fcfc7df16-f064-4871-93cc-79f089a29045%2Ffad2637c-58fd-4eb7-ba13-df86b245829b.png/size/w=2000?exp=1733129442&sig=NXH1zo2SWcw9gclZ22mReVV7PC8-1HvE76GlHFC1SVs)

- 삼성 SDS 기업연계 프로젝트
- 개발기간: 2024.10.14 ~ 2024.11.19
- 성과: 전국 프로젝트상우수상(삼성전자)

## 프로젝트 소개

---

![busybee3.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbef53de-55a7-4b44-b51f-16508766f48a/0e01067c-8921-48cc-a4ed-fefb51e62a8e/busybee3.png)

**매일매일 반복되는 메일업무! 이젠 Busy 하지 말고 BusyBee 하세요 !**

- Busy Bee는 AI 기반 물류 업무메일 의도분류 및 업무 자동화 서비스 입니다.
- 인텔리전스 자동화로 이메일의 내용과 첨부파일, zip파일을 분석하여 업무메일의 의도를 분류하고 업무까지 자동화 합니다.
- 이메일로 이루어지는 물류 포워딩 업무에 필요한 견적요청검토, 견적 산출, 물류 계약, 컨테이너 모니터링 일체를 제공합니다.

## **👨‍👩‍👧‍👦 Developer**

| 김도이 | 정현조 | 노영호 |
| --- | --- | --- |
| <img width="160px" src="https://avatars.githubusercontent.com/u/153525545?v=4" /> | <img width="160px" src="https://avatars.githubusercontent.com/u/109647275?v=4" /> | <img width="160px" src="https://avatars.githubusercontent.com/u/161284817?v=4" /> |
| [@kimdobbang](https://github.com/kimdobbang) | [@HyunjoJung](https://github.com/HyunjoJung) | [@youngho98](https://github.com/youngho98) |
| 팀장/BE/IoT | AI/Infra | BE/IoT |

| 박민호 | 고승희 | 임종혁 |
| --- | --- | --- |
| <img width="160px" src="https://avatars.githubusercontent.com/u/97956971?v=4" /> |<img width="160px" src="https://avatars.githubusercontent.com/u/86093028?v=4" /> | <img width="160px" src="https://avatars.githubusercontent.com/u/42922673?v=4" /> |
| [@마이노](https://github.com/parkminho-zz) | [@alex-koko](https://github.com/alex-koko) | [@limjongheok](https://github.com/limjongheok) |
| FE | FE | Infra |

# 2. 주요기능

---

🐝 **이메일 서비스 및 이메일 의도 분류**

- 받은 이메일에서 필요한 정보와 첨부파일을 추출한 후, 이메일의 내용을 분석하여 의도에 맞게 분류합니다.

🐝 **자동 견적 산출 및 이메일 발송**

- 이메일에서 추출한 데이터를 기반으로 자동으로 견적을 산출하고, 이를 바탕으로 견적 메일을 고객에게 자동으로 발송합니다.

🐝 **인텔리전스 업무 자동화**

- 화물 및 물류 견적을 요청한 고객이 제공한 정보에 누락이나 오류가 있을 경우 이를 자동으로 식별하고, 해당 정보를 다시 요청하는 LLM(대형 언어 모델) 기반 챗봇을 통해 고객에게 회신합니다.

🐝 **챗봇**

- 챗봇은 고객이 필요한 정보를 모두 입력하면 자동으로 견적을 산출하여 회신합니다.
- 또한, 챗봇은 물류 관련 다양한 질문을 처리할 수 있으며, 다국어 지원과 음성 인식 기능도 제공합니다.

🐝 **IoT 물류 컨테이너 모니터링**

- 물류 계약이 완료되면, 고객은 실행사의 컨테이너 내부 상황을 실시간으로 모니터링할 수 있는 대시보드를 통해 화물의 상태를 확인할 수 있습니다.

# 3. 프로젝트 기술 스택 및 개발환경

---

- **프로그래밍 언어**: Python, JavaScript, Arduino C, Java, TypeScript
- **클라우드 환경**: AWS Lambda, API Gateway, S3, SES, Route 53, CloudFront, EC2, Cognito, Amazon Translate
- **AI/ML**: LangChain, GPT-4o Mini, Distilkobert, PyTorch
- **IoT 및 센서**: Arduino Uno, 온습도 센서(DHT11), GPS 모듈(GY-GPS6MV2), 카메라(ESP32-CAM)
- **데이터베이스**: DynamoDB
- **메시지 큐**: AWS SQS, SNS
- **Frontend** : React
- **IAC** : Terraform

# 4. 화면 구성

---

## 4.1. 로그인

![9.로그인(코그니토).PNG](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2F9cc54abe-b268-4feb-9cbe-6989e903e3c9%2F9.%EB%A1%9C%EA%B7%B8%EC%9D%B8(%EC%BD%94%EA%B7%B8%EB%8B%88%ED%86%A0).png/size/w=2000?exp=1733129545&sig=nBk0VjiAYIFIqtorlxF1vnLhmpJ2nhTiCWMKHjN8bko)

- 코그니토를 사용하여 유저 로그인, 로그아웃, 회원가입 기능을 구현했습니다.
- 유저 데이터와 비밀번호는 개인 데이터베이스에 저장하지 않고, AWS에서 관리하므로 보안 문제가 없습니다.
- 유저 그룹에 따라 서로 다른 권한을 부여할 수 있습니다.

## 4.2. 메일함

![image.png](https://img.notionusercontent.com/s3/prod-files-secure%2F67647f11-5d74-47d2-a281-3299272bad3e%2Fbca82292-c99d-4bd1-bbe3-d3da9cc40324%2F%EB%A9%94%EC%9D%BC%ED%95%A9%EC%84%B1.png/size/w=2000?exp=1733214806&sig=aTq2vPiJTAErTtupESGIHSUVzAFCfOja6e7r2TLdmog)

![8.메일함상세.PNG](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2Fee7c64b2-1128-45a5-b4d4-07a6b72da839%2F8.%EB%A9%94%EC%9D%BC%ED%95%A8%EC%83%81%EC%84%B8.png/size/w=2000?exp=1733129389&sig=ADIy8W8QUCfiiDceBCh-rNEg0SZLBZs7RviAoP11Px8)

- 관리자 계정은 도착한 이메일의 본문과 첨부파일을 조회할 수 있습니다.
- 메일함에서는 메일 내용을 분석하고, 이를 바탕으로 이메일을 **견적**, **주문**, **스팸**, **기타**로 4가지로 분류하고 태그를 자동으로 붙입니다.

## 4.3. 대시보드

![1.대시보드.PNG](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2F1317a753-5750-445b-a702-efda63da7476%2F1.%EB%8C%80%EC%8B%9C%EB%B3%B4%EB%93%9C.png/size/w=2000?exp=1733129576&sig=n9vdqOTD5mvTWi64SQZTotCJRbYxm9aPOoy9xieflys)

![대시보드녹화5.gif](https://file.notion.so/f/f/dbef53de-55a7-4b44-b51f-16508766f48a/5521bfbb-8389-4544-bb0f-c556dd8d674e/%EB%8C%80%EC%8B%9C%EB%B3%B4%EB%93%9C%EB%85%B9%ED%99%945.gif?table=block&id=dd1bbc3e-462c-421f-a530-119b10e7972a&spaceId=dbef53de-55a7-4b44-b51f-16508766f48a&expirationTimestamp=1733270400000&signature=soqWjYkV6Qp-POd3DIfLzSAHklioeSdsywYXjUYpsy0)

- 대시보드에서는 현재 배송 중인 건의 단계와, 배송 중일 경우 실시간 위치를 지도에서 조회할 수 있습니다.
- 카메라를 통해 컨테이너 내부 상황을 실시간으로 볼 수 있으며, 열림 감지, 온도, 습도 정보 등을 제공하여 물류가 정상적으로 배송되고 있는지 확인할 수 있습니다.
- 운송지에 도착한 후 **RFT 태그**를 찍어 운송 완료 처리를 할 수 있습니다.

## 4.4. 채팅

![10-2.채팅링크메일(구글).png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2F35c29d7e-ed83-4238-972f-392c76df84aa%2F10-2.%EC%B1%84%ED%8C%85%EB%A7%81%ED%81%AC%EB%A9%94%EC%9D%BC(%EA%B5%AC%EA%B8%80).png/size/w=2000?exp=1733129734&sig=CzKPDO4aFL7D8FXbwKT0zz_jzCOMIJ8EJlLsQNkKOps)

- 견적 요청 메일을 보낼 때, 누락된 정보가 있다면 채팅 링크를 통해 추가 정보를 받을 수 있습니다.

![11-1.채팅.png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2Ffef650df-e230-4f56-ae61-b8405eae5073%2F11-1.%EC%B1%84%ED%8C%85.png/size/w=2000?exp=1733129755&sig=K1cIiK21ZDz0I1WO16o2Bnpg_rXfRzMHdlIFWyeVaWU)

- 자연어를 이용해 유연하게 추가 정보를 입력받을 수 있습니다. 요청된 순서나 보기 내에서만 요청하는 것이 아니라, 필요할 때 돌발적인 정보도 요청할 수 있습니다. 특히, 사용자의 요청에 따라 Tavily(AI 기반 검색 엔진)를 이용해 최신 물류 뉴스와 운송 가능 지역을 제공할 수 있습니다.

![image.png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2Fa1430203-cb03-4e40-866b-ee0e1b5ed686%2Fimage.png/size/w=2000?exp=1733129791&sig=TZOJTBypEmVkPjpXUMt2sM-oDrvYrTEkZU7i0lf1a78)

![image.png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2F81c24cad-ef2b-42b9-9d76-365be6e314f2%2Fimage.png/size/w=2000?exp=1733129878&sig=Jpl_V24PLvqQQ8UHfGH1ZPszr2yvVK_UICf7WHP2vhg)

![image.png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2F1db9e345-91e1-4ee6-ba0a-e5afa3e3a438%2Fimage.png/size/w=2000?exp=1733129908&sig=Q-EVS4DImhyoPee_tZu_WY4rhUva-a58bwC255sncRE)

![image.png](https://img.notionusercontent.com/s3/prod-files-secure%2Fdbef53de-55a7-4b44-b51f-16508766f48a%2F9f6bea83-cfe4-4f91-9eec-4d8d59eeed6e%2Fimage.png/size/w=2000?exp=1733129928&sig=CKFXvFpiPI7qX7-r-kCUoFV7rL9ok4w4qn3RnZFczzc)

- 영어, 일본어, 태국어 등 다른 언어로 요청할 시 해당 언어로 답변을 제공합니다.
- 채팅 아키텍쳐
![채팅 아키텍쳐.png](https://img.notionusercontent.com/s3/prod-files-secure%2F67647f11-5d74-47d2-a281-3299272bad3e%2Faab5f3e1-893b-478e-9652-ff04ad1c986d%2FIMG_9331.jpeg/size/w=2000?exp=1733214712&sig=ymjTBHOq5xMuxI6K4atQ9NhWDYwyAJPiY3sPB14AQYg)


# 5. 아키텍쳐

---

![비지비 아키텍쳐.png](https://img.notionusercontent.com/s3/prod-files-secure%2F67647f11-5d74-47d2-a281-3299272bad3e%2F4b3ef4df-b74d-4e44-ac46-0c78f08ea1f7%2Fa05d494c-bfed-4518-81dd-e526a5e010d4.png/size/w=2000?exp=1733214592&sig=TUL3aGqgXWMERzFArb8IxcC-TN3qL2BxfN4DYM0ybGc)

# 6. 개선사항

---

## 1. Lambda 사용을 통한 비용 절감

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbef53de-55a7-4b44-b51f-16508766f48a/84789f43-4b3b-424a-9c8f-a371d07d53ca/image.png)

## 2. AI

### 2-1. DistilKoBert 모델 학습 파이프라인 구축

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbef53de-55a7-4b44-b51f-16508766f48a/8c82ed64-d9a1-4106-bf98-a66e060411ae/image.png)

사람이 이메일 데이터의 분류를 확인하게 되면 SQS에 들어가게 되고, 특정 사이즈 이상이 될 경우 훈련 데이터로 사용되게 했습니다.

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbef53de-55a7-4b44-b51f-16508766f48a/8d9e61d8-0afb-4959-9fef-4a448d28dad5/image.png)

학습을 통해 85% 수치까지 개선되는 것을 확인하였습니다.

### 2-2. 이메일에서 견적에 필요한 정보 추출 모델 개발

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbef53de-55a7-4b44-b51f-16508766f48a/6c5f771f-a426-4048-9476-06b8f5be54f0/image.png)

LM 스튜디오를 통해 여러 모델을 실행해보고 비교해보고, 가장 빠른 GPT-4o-mini 모델을 채택했습니다.

### 2-3. LangGraph + RAG 활용

![image.png](https://prod-files-secure.s3.us-west-2.amazonaws.com/dbef53de-55a7-4b44-b51f-16508766f48a/c8bedb26-0f64-4207-acff-882071c8ae1a/image.png)

LangGraph를 활용하여, 디버깅을 유용하게 하고 Tavily라는 AI 에이전트(특히 LLMs)를 위해 최적화된 선도적인 검색 엔진을 활용하게 했습니다.

# 7. 회고

---

| **이름**  | **회고** |
|-----------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| **김도이** | 이번 프로젝트는 팀장으로서 프로젝트 전반을 이끌고, 백엔드와 IoT 개발을 책임지며 기술적 성장뿐만 아니라 비즈니스 문제 해결 능력과 실무 감각을 키울 수 있었던 뜻깊은 경험이었습니다. 특히, 기업 환경에서 발생하는 실제 문제를 분석하고 이를 해결하기 위한 최적의 시스템을 설계하며, 효율적인 아키텍처의 중요성을 몸소 체감할 수 있었습니다.<br>**서버리스 아키텍처 채택**<br>프로젝트 초기에 서버 유휴 시간과 리소스 낭비 가능성을 확인한 뒤, 기존의 온프레미스나 EC2 기반 구조 대신 서버리스 아키텍처를 채택 했습니다. 이를 통해 AWS Lambda를 중심으로 한 서버리스 서비스를 도입하여 필요한 시점에만 자원을 사용하는 최적화된 구조를 설계했습니다. Lambda 환경에서 cold start를 줄이기 위해 java 대신 javascript로 개발 했습니다. 그 결과, 운영 비용 절감과 시스템 효율성 향상이라는 목표를 달성했으며, 이러한 경험은 효율적인 클라우드 아키텍처 설계에 대한 통찰을 제공해 주었습니다.<br>**챗봇 구현**<br>WebSocket 기반의 실시간 챗봇 애플리케이션을 설계하고 구현했습니다. Lambda를 통해 이벤트 기반 메시지 처리 로직을 구축하고, API Gateway로 WebSocket 연결을 관리하며 사용자와 실시간으로 소통할 수 있는 기능을 제공했습니다. 또한, DynamoDB Stream을 활용해 사용자 메시지와 상태를 효율적으로 관리하며 확장성을 고려해 구현 했습니다. 이러한 과정에서 서버리스 아키텍처의 유연성을 살릴 수 있었습니다.<br>**IoT 개발과 실시간 모니터링**<br>MQTT 서버를 구축하여 다양한 IoT 센서로부터 데이터를 수집하고 이를 실시간으로 처리하며, 프론트엔드 대시보드를 통해 데이터를 시각적으로 모니터링할 수 있는 환경을 제공했습니다. 이러한 경험은 IoT 기술과 클라우드 서비스의 통합 가능성을 확인하고, 데이터를 실시간으로 수집하고 처리하는 서비스를 설계하는 소중한 경험이었습니다.<br>**프로젝트 리더로서의 성장**<br>팀장으로서 팀원들의 역량을 최대한 발휘할 수 있도록 의사소통과 협업에 집중했습니다. 삼성 SDS와의 협업 과정에서 멘토님의 실질적인 조언을 통해, 기업의 요구사항을 분석하고 이에 맞는 솔루션을 설계하는 방법을 배울 수 있었습니다. 이를 통해 팀원들과 함께 효율적이고 완성도 높은 결과물을 만들어낼 수 있었습니다. |
| **임종혁** | 이 프로젝트는 효율적인 아키텍처 설계와 인프라 관리 방법을 배우는 소중한 기회가 되었습니다. 프로젝트 사용 시간을 분석한 결과, 서버 유휴 시간이 많다는 점을 파악하여 기존의 온프레미스 방식이나 EC2 기반의 클라우드 서버 대신, 서버리스 아키텍처를 도입하는 방향으로 설계했습니다. 이를 통해 Lambda와 같은 서버리스 서비스를 활용하여 필요한 시간에만 리소스를 사용하도록 최적화된 구조를 구현할 수 있었으며, 이를 통해 비용을 절감하고 운영 효율성을 크게 높일 수 있었습니다.<br><br>또한, 인프라 관리에 있어 반복적인 작업에서 어려움을 느끼며, Terraform과 같은 IaC 도구를 활용해 인프라를 코드로 관리하는 방법을 익히는 계기가 되었습니다. 이를 통해 인프라 설정과 관리를 더욱 체계적이고 효율적으로 관리할 수 있었습니다.<br><br>무엇보다 이 프로젝트는 실제 기업이 직면하는 문제와 요구사항을 깊이 이해하고, 이를 해결하기 위한 실질적인 솔루션을 설계하는 경험을 제공했습니다. 이러한 과정은 실무에서 요구되는 문제 해결 능력을 한층 더 강화시켜 주었고, 효율적이고 유연한 아키텍처 설계에 대한 통찰을 얻게 해준 뜻깊은 경험이었습니다. |
| **박민호** | 이번 프로젝트는 AWS와 Node.js, React의 연동을 통해 실질적인 문제를 해결하는 과정을 경험할 수 있었습니다. 초기에는 예상치 못한 오류들로 인해 어려움을 겪었지만, 이를 해결하면서 시스템 설계와 클라우드 서비스 활용 능력을 크게 향상시킬 수 있었습니다.<br><br>CORS 설정 누락, AWS Layer 폴더 구조 및 압축 실수, SES 인증 미리 준비하지 않은 점 등 "작은 실수가 큰 문제로 이어질 수 있다"는 교훈을 얻었고, 문제를 해결하는 과정이 곧 성장의 발판이 된다는 점을 다시 한번 느꼈습니다.<br><br>특히, 삼성SDS와 프로젝트를 연계하며 현업에서 사용되는 기술 스택과 문제 해결 방식에 대해 더 깊이 이해할 수 있었습니다. 이를 통해 현업에서 요구하는 실무 능력과 AWS 서비스의 활용 방안을 체계적으로 학습할 수 있는 기회가 되었습니다. 이러한 경험은 실제 업무 환경에서도 빠르게 적응할 수 있는 자신감을 심어주었습니다. |
| **정현조** | 이 프로젝트는 AWS 클라우드 환경에 대한 학습 기회를 제공해 주었습니다. SDS의 요구사항에 따라 서버리스 아키텍처를 설계하였으며, Lambda를 활용하여 이벤트 기반의 최적화된 구조를 구현하였습니다.<br><br>CI/CD 파이프라인은 Serverless Framework를 기반으로 구축되었으며, 각 Lambda 함수는 개별 브랜치에서 코드 변경 사항을 관리하도록 구성하였습니다. 브랜치별로 자동으로 배포 환경에 적용되도록 CI/CD 파이프라인을 연동하여 관리의 효율성과 확장성을 확보하였습니다.<br><br>AI 작업에서는 LangChain 전부를 JavaScript로 구현하여 Lambda 환경에서 보다 빠른 실행 성능을 확보하였습니다. 또한, LangGraph를 활용하여 디버깅과 워크플로우 관리의 복잡성을 줄이는 데 큰 도움을 받았습니다. |
| **고승희** | 이번 프로젝트는 프론트엔드 개발자로서 메일함과 대시보드를 연동하고, 대시보드에서 IoT 웹소켓 데이터를 실시간으로 표시하는 기능을 구현하는 경험이었습니다. 또한, SES를 이용해 이메일을 특정 도메인으로 받아 S3에 저장하는 작업을 통해 AWS 서비스를 실무에서 어떻게 활용하는지 배웠습니다.<br><br>DynamoDB에 이메일을 분류 저장하는 기능을 구현한 팀원들과 협업하며, 이메일 조회 API를 설계하고 구현하는 과정에서 데이터베이스와 API 설계의 중요성을 깨달았습니다.<br><br>특히, 서버리스 환경에서 Lambda를 활용하여 온프레미스나 EC2 없이 효율적으로 서비스를 구현하는 방법을 배웠습니다. 이를 통해 서버 관리와 비용 절감을 동시에 달성할 수 있음을 깨달았습니다.<br><br>이번 프로젝트는 클라우드 기반 아키텍처 설계와 효율적인 인프라 관리 방법을 배우는 기회였으며, 문제 해결 능력을 키울 수 있었습니다. |
| **노영호** | 삼성SDS와의 기업연계 프로젝트는 실제 기업 환경에서의 업무 방식을 배우고, 효율적인 시스템 설계와 개발 방법을 익히는 귀중한 경험이었습니다. 멘토님의 실무 중심 조언 덕분에 기업이 직면하는 문제를 분석하고 해결하는 과정을 직접 체험할 수 있었습니다.<br><br>특히, AWS Lambda를 활용한 서버리스 아키텍처 설계를 통해 자원의 유휴 시간을 줄이고 비용 효율성을 높이는 시스템을 구현할 수 있었습니다. AWS의 다양한 서비스를 활용하며 클라우드 환경에서의 통합 경험을 쌓았고, IoT 기술을 적용해 데이터를 수집하고 처리하는 과정을 경험하며 기술의 실제 활용 가능성을 깊이 이해할 수 있었습니다.<br><br>이 프로젝트를 통해 기술적인 성장과 더불어 비즈니스 문제 해결 능력과 실무 감각을 키울 수 있었고, 이를 기반으로 효율적이고 유연한 시스템 설계 역량을 한층 강화할 수 있었습니다. |
