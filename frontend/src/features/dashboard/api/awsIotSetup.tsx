import React, { useEffect } from 'react';
import * as awsIot from 'aws-iot-device-sdk';

export function setUpAwsIot() {
  const device = new awsIot.device({
    keyPath: 'path/to/private.pem.key',
    certPath: 'path/to/device.pem.crt',
    caPath: 'path/to/AmazonRootCA1.pem',
    clientId: 'myAwsIotClient',
    host: 'your-iot-endpoint.amazonaws.com',
  });

  device.on('connect', () => {
    console.log('Connected to AWS IoT Core');
    device.subscribe('my/topic');
  });

  device.on('message', (topic, payload) => {
    console.log('AWS IoT Message:', topic, payload.toString());
  });

  return device;
}
