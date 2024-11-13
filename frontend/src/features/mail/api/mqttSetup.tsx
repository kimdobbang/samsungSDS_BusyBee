// MQTT 설정 파일 (mqttSetup.js 또는 mqttSetup.ts)
import mqtt from 'mqtt';

export function setupMqtt() {
  const brokerUrl = 'wss://<your-mqtt-broker-url>:443/mqtt'; // MQTT 브로커 URL

  const client = mqtt.connect(brokerUrl, {
    clientId: 'myMqttClient',
    // 필요할 경우 인증 정보 추가
  });

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('my/topic');
  });

  client.on('message', (topic, message) => {
    console.log('MQTT Message:', topic, message.toString());
  });

  return client;
}
