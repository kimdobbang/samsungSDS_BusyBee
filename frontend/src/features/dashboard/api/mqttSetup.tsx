import mqtt from 'mqtt';
import { SensorData } from 'shared/types/sensorData';

// export function setupMqtt(setSensorData: (data: SensorData) => void) {
export function setupMqtt() {
  const brokerUrl = 'ws://52.78.28.1:8080'; // MQTT 브로커 URL

  const client = mqtt.connect(brokerUrl, {
    clientId: `myMqttClient-${Math.random().toString(16).slice(2)}`,
    keepalive: 60,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    console.log('Connected to MQTT broker');
    client.subscribe('sensor/data', (err) => {
      if (err) {
        console.error('Subscription error:', err);
      } else {
        console.log('Successfully subscribed to sensor/data');
      }
    });
  });

  client.on('message', (topic, message) => {
    if (topic === 'sensor/data') {
      try {
        const data = JSON.parse(message.toString());
        console.log('Received data:', data);
        // setSensorData(data);
      } catch (error) {
        console.error('Failed to parse sensor data:', error);
      }
    }
  });

  client.on('error', (error) => {
    console.error('MQTT connection error:', error);
  });

  client.on('offline', () => {
    console.log('MQTT client is offline');
  });

  client.on('close', () => {
    console.log('MQTT connection closed');
  });

  return client;
}
