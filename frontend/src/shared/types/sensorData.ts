export class SensorData {
  humidity: number;
  isOpen: boolean;
  latitude: number;
  longitude: number;
  status: number;
  temperature: number;

  constructor(data: Partial<SensorData> = {}) {
    this.humidity = data.humidity ?? 0;
    this.isOpen = data.isOpen ?? false;
    this.latitude = data.latitude ?? 0;
    this.longitude = data.longitude ?? 0;
    this.status = data.status ?? 0;
    this.temperature = data.temperature ?? 0;
  }
}

export class GpsData {
  lat: number;
  lon: number;

  constructor(data: Partial<GpsData> = {}) {
    this.lat = data.lat ?? 0;
    this.lon = data.lon ?? 0;
  }
}
