#include "secret.h"           // WiFi 및 MQTT 서버 정보가 저장된 파일
#include <WiFiS3.h>         // WiFiS3 라이브러리 포함
#include <PubSubClient.h>   // PubSubClient 라이브러리 포함
#include <DHT.h>            // DHT 라이브러리 포함
#include <MFRC522.h>        // RFID 라이브러리 포함
#include <SoftwareSerial.h> // GPS 시리얼 통신
#include <ArduinoJson.h>    // ArduinoJson 라이브러리 포함

#define TRIG 6        // TRIG 핀 설정 (초음파 보내는 핀)
#define ECHO 7        // ECHO 핀 설정 (초음파 받는 핀)
#define THRESHOLD 40  // 감지 거리 임계값 (cm)

// SensorData 구조체 선언
struct SensorData {
  double latitude;     // 위도
  double longitude;    // 경도
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

// GPS 설정
SoftwareSerial gps(2, 3);   // GPS 통신 핀
String gpsData = "";        // GPS 데이터를 저장할 문자열 변수

void setup() {
  Serial.begin(9600);

  // WiFi 연결 설정
  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(1000);
    Serial.println("Connecting to WiFi...");
  }
  Serial.println("Connected to WiFi");

  client.setServer(mqtt_server, 1883);
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

  delay(1000);  // 5초마다 데이터 발행
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

  // GPS 모듈 통신 시작
  gps.begin(9600);

  Serial.println("Sensors initialized.");
}

// MQTT 재연결 함수
void reconnect() {
  while (!client.connected()) {
    Serial.print("Attempting MQTT connection...");
    if (client.connect("ArduinoClient")) {
      Serial.println("connected");
    } else {
      Serial.print("failed, rc=");
      Serial.print(client.state());
      delay(1000);
    }
  }
}

// 센서 데이터 수집 함수
void collectSensorData() {
  // GPS 데이터 수신
  if (gps.available()) {
    char c = gps.read();

    if (isPrintable(c)) {
      gpsData += c; // GPS 데이터 누적
    }

    if (c == '\n') { // 한 문장이 끝났을 때
      if (gpsData.startsWith("$GPRMC") && gpsData.length() > 10) {
        parseGPRMC(gpsData); // GPRMC 데이터 파싱 및 출력
      }
      gpsData = ""; // 문자열 초기화
    }
  }

  // 온도 및 습도 데이터 읽기
  sensorData.humidity = dht.readHumidity();
  sensorData.temperature = dht.readTemperature();

  if (isnan(sensorData.humidity) || isnan(sensorData.temperature)) {
    Serial.println("온습도 센서에서 데이터를 읽을 수 없습니다!");
  }

  // RFID 카드 읽기
  if (rfid.PICC_IsNewCardPresent() && rfid.PICC_ReadCardSerial()) {
    String cardID = getRFIDCardID(rfid);  // RFID 카드 ID 추출
    Serial.print("RFID 카드 ID: ");
    Serial.println(cardID);  // 카드 ID 출력

    if (cardID.equals("02 20 CE 01")) { // 파란색 태그
      sensorData.status = 4;
    } else if (cardID.equals("95 00 3A 02")) { // 흰색 카드
      sensorData.status = 5;
    }

    rfid.PICC_HaltA();  // RFID 카드 읽기 중지
  }

  // 초음파 
  int distance = measureDistance(); // 거리 측정
  Serial.print("측정 거리: ");
  Serial.println(distance);

  if (distance >= THRESHOLD) {
    sensorData.isOpen = true;
  } else {
    sensorData.isOpen = false;
  }
}

// GPRMC 메시지를 파싱하여 위치 정보 출력
void parseGPRMC(String data) {
  // 원본 GPS 데이터를 출력
  Serial.print("Raw GPS Data: ");
  Serial.println(data);
  
  int commaIndex1 = data.indexOf(','); 
  int commaIndex2 = data.indexOf(',', commaIndex1 + 1); 
  int commaIndex3 = data.indexOf(',', commaIndex2 + 1); 
  int commaIndex4 = data.indexOf(',', commaIndex3 + 1); 
  int commaIndex5 = data.indexOf(',', commaIndex4 + 1); 
  int commaIndex6 = data.indexOf(',', commaIndex5 + 1);
  int commaIndex7 = data.indexOf(',', commaIndex6 + 1);

  // 유효성 확인
  String status = data.substring(commaIndex2 + 1, commaIndex3);
  if (status != "A") {
    Serial.println("위치 정보가 유효하지 않습니다.");
    return;
  }

  // 위도와 경도 값 추출
  String lat = data.substring(commaIndex3 + 1, commaIndex4);
  String latDir = data.substring(commaIndex4 + 1, commaIndex5);
  String lon = data.substring(commaIndex5 + 1, commaIndex6);
  String lonDir = data.substring(commaIndex6 + 1, commaIndex7);

  // 위도와 경도를 실수로 변환
  sensorData.latitude = convertToDecimalDegrees(lat, 2);
  sensorData.longitude = convertToDecimalDegrees(lon, 3);

  // 방향에 따라 부호 조정
  if (latDir == "S") sensorData.latitude = -sensorData.latitude;
  if (lonDir == "W") sensorData.longitude = -sensorData.longitude;
}

// DMM 형식을 Decimal Degrees로 변환하는 함수
double convertToDecimalDegrees(String dmm, int degreeDigits) {
  double degrees = dmm.substring(0, degreeDigits).toDouble(); // 도 부분 추출
  double minutes = dmm.substring(degreeDigits).toDouble();    // 분 부분 추출
  return degrees + (minutes / 60.0);                          // 분을 도로 변환
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

// SensorData 구조체를 JSON으로 변환하는 함수
String convertToJSON(SensorData data) {
  // JSON 문서 객체 생성 (메모리 크기는 데이터 양에 맞게 설정)
  StaticJsonDocument<256> jsonDoc;

  // JSON 객체에 구조체 데이터 추가
  jsonDoc["latitude"] = data.latitude;
  jsonDoc["longitude"] = data.longitude;
  jsonDoc["isOpen"] = data.isOpen;
  jsonDoc["temperature"] = data.temperature;
  jsonDoc["humidity"] = data.humidity;
  jsonDoc["status"] = data.status;

  // JSON 문서를 문자열로 변환
  String jsonString;
  serializeJson(jsonDoc, jsonString);

  return jsonString; // JSON 문자열 반환
}