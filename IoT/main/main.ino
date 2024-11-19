#include "secret.h"           // WiFi 및 MQTT 서버 정보가 저장된 파일
#include <WiFiS3.h>         // WiFiS3 라이브러리 포함
#include <PubSubClient.h>   // PubSubClient 라이브러리 포함
#include <DHT.h>            // DHT 라이브러리 포함
#include <MFRC522.h>        // RFID 라이브러리 포함
#include <ArduinoJson.h>    // ArduinoJson 라이브러리 포함

#define TRIG 6        // TRIG 핀 설정 (초음파 보내는 핀)
#define ECHO 7        // ECHO 핀 설정 (초음파 받는 핀)
#define THRESHOLD 40  // 감지 거리 임계값 (cm)

// SensorData 구조체 선언
struct SensorData {

  float temperature;   // 온도
  float humidity;      // 습도
  bool isOpen;       // 문 열림 상태 (문이 열렸으면 true, 아니면 false)
  int status = 3;      // 상태 정보 (3, 4, 5)
};

// 전역 구조체 변수 선언
SensorData sensorData;
WiFiClient espClient;
PubSubClient client(espClient);

// DHT 센서 설정                                     
#define DHTPIN 4          // DHT 센서를 연결한 핀 번호
#define DHTTYPE DHT11     // DHT 센서 종류 (DHT11)
DHT dht(DHTPIN, DHTTYPE); // DHT 센서 객체 생성

// RFID 설정
#define SS_PIN 10               // RFID SS 핀 (SPI 핀: 10번)
#define RST_PIN 9               // RFID RST 핀 (SPI 핀: 9번)
MFRC522 rfid(SS_PIN, RST_PIN);  // RFID 객체 생성

void setup() {
  Serial.begin(9600);

  // WiFi 연결 설정
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  } if (WiFi.status() != WL_CONNECTED) {
    Serial.println("Failed to connect to WiFi. Please check credentials.");
  } else {
    Serial.println("Connected to WiFi");
  }

  // MQTT 설정
  client.setServer(mqtt_server, 1883);
  client.setCallback(mqttCallback);  // MQTT 콜백 함수 등록

  // 센서 설정
  setupSensors();
}

void loop() {
  if (!client.connected()) {
    reconnect();
  }
  client.loop();

  // 센서 데이터를 수집하여 JSON으로 변환
  collectSensorData();
  String jsonData = convertToJSON(sensorData);
  Serial.println("jsonData = " + jsonData);
  
  char jsonBuffer[256];
  jsonData.toCharArray(jsonBuffer, jsonData.length() + 1);

  // MQTT 주제에 JSON 데이터 발행
  client.publish("sensor/data", jsonBuffer);

  delay(1500);  // 1.5초마다 데이터 발행
}

// 센서 초기화 함수
void setupSensors() {
  // DHT 센서 시작
  dht.begin();

  // 초음파 센서 시작
  pinMode(TRIG, OUTPUT);
  pinMode(ECHO, INPUT);

  // RFID SPI 통신 시작
  SPI.begin();

  // RFID 모듈 초기화
  rfid.PCD_Init();

  Serial.println("Sensors initialized.");
}
// MQTT 재연결 함수
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ArduinoClient")) {
      Serial.println("connected");
      // 특정 주제 구독
      client.subscribe("sensor/control");  // "sensor/control" 주제 구독
      Serial.println("Subscribed to topic: sensor/control");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(1500);  // 1.5초 대기 후 재시도
    }
  }
}


// 센서 데이터 수집 함수
void collectSensorData() {
    // 온도 및 습도 데이터 읽기
  sensorData.humidity = dht.readHumidity();
  sensorData.temperature = dht.readTemperature();

  if (isnan(sensorData.humidity) || isnan(sensorData.temperature)) {
    Serial.println("Failed to read from DHT sensor! Retrying...");
    delay(1000);
    collectSensorData();  // 재시도
  }
  
  // RFID 카드 읽기
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardID = getRFIDCardID(rfid);  // RFID 카드 ID 추출
    Serial.print("RFID 카드 ID: ");
    Serial.println(cardID); // 카드 ID 출력

    cardID.trim();
    cardID.toUpperCase();

    if (cardID.equals("02 20 CE 01")) { // 파란색 태그
      sensorData.status = 4;
    } else if (cardID.equals("95 00 3A 02")) { // 흰색 카드
      sensorData.status = 5;
    }

    rfid.PICC_HaltA();
  }

  // 초음파 센서
  int distance = measureDistance(); // 거리 측정
  Serial.print("측정 거리: ");
  Serial.println(distance);

  if (distance >= THRESHOLD) {
    sensorData.isOpen = true;
  } else {
    sensorData.isOpen = false;
  }
}

// RFID 카드 ID를 추출하여 String으로 반환하는 함수
String getRFIDCardID(MFRC522 &rfid) {
  String cardID = "";
  for (byte i = 0; i < rfid.uid.size; i++) {
    cardID += String(rfid.uid.uidByte[i] < 0x10 ? " 0" : " ");
    cardID += String(rfid.uid.uidByte[i], HEX);
  }
  cardID.trim();
  return cardID;
}

// 초음파 센서를 통해 거리 측정 및 물체 감지 여부 반환
int measureDistance() {
  long duration, distance;

  digitalWrite(TRIG, LOW);
  delayMicroseconds(2);
  digitalWrite(TRIG, HIGH);
  delayMicroseconds(10);
  digitalWrite(TRIG, LOW);

  duration = pulseIn(ECHO, HIGH);   // ECHO 핀으로 신호가 돌아오는 시간을 측정
  distance = duration * 17 / 1000;  // 시간을 거리로 변환 (cm 단위)

  return distance;
}

// SensorData 구조체 -> JSON변환함수
String convertToJSON(SensorData data) {
  StaticJsonDocument<256> jsonDoc;

  // JSON 객체에 구조체 데이터 추가
  jsonDoc["isOpen"] = data.isOpen;
  jsonDoc["temperature"] = data.temperature;
  jsonDoc["humidity"] = data.humidity;
  jsonDoc["status"] = data.status;

  // JSON 문서를 문자열로 변환
  String jsonString;
  serializeJson(jsonDoc, jsonString);

  return jsonString;
}

// MQTT 메시지를 수신하는 콜백 함수
void mqttCallback(char* topic, byte* payload, unsigned int length) {
  Serial.print("Message arrived on topic: ");
  Serial.println(topic);

  // 수신된 메시지를 문자열로 변환
  String message;
  for (unsigned int i = 0; i < length; i++) {
    message += (char)payload[i];
  }
  Serial.print("Message: ");
  Serial.println(message);

  // 특정 요청 처리
  if (String(topic) == "sensor/control") { 
    if (message == "status_3") {
      sensorData.status = 3;
      Serial.println("Status updated to 3");
    } else if (message == "status_4") {
      sensorData.status = 4;
      Serial.println("Status updated to 4");
    } else if (message == "status_5") {
      sensorData.status = 5;
      Serial.println("Status updated to 5");
    } else {
      Serial.println("Invalid status update command");
    }
  }
}
