// MQTT 설정 파일 (mqttSetup.js 또는 mqttSetup.ts)
import mqtt from 'mqtt';

export function setupMqtt() {
  const brokerUrl = 'ws://52.78.28.1:8080'; // MQTT 브로커 URL

  const client = mqtt.connect(brokerUrl, {
    clientId: 'myMqttClient',
    // 필요할 경우 인증 정보 추가
  });

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('sensor/data'); // 구독할 주제
  });

  client.on('message', (topic, message) => {
    console.log('MQTT Message:', topic, message.toString());
  });

  return client;
}
