export type RowData = {
  Id?: { S: string };
  sender: { S: string };
  received_date: { S: string };
  status: { N: number };
  data?: { S: string };
  receiver?: { S: string };
};

export interface SendMailModalProps {
  orderId: string;
  showModal: boolean;
  onClose: () => void;
  onSend?: () => void;
  sender: string;
  REreceiver: string;
  Weight: number;
  ContainerSize: number;
  DepartureDate: string;
  ArrivalDate: string;
  DepartureCity: string;
  ArrivalCity: string;
}

// SensorData 클래스 업데이트
export class SensorData {
  humidity: number;
  isOpen: boolean;
  temperature: number;
  status: number;

  constructor(data: Partial<SensorData> = {}) {
    this.humidity = data.humidity ?? 0;
    this.isOpen = data.isOpen ?? false;
    this.temperature = data.temperature ?? 0;
    this.status = data.status ?? 0;
  }
}

// GpsData 클래스 업데이트
export class GpsData {
  lat: number; // 위도
  lon: number; // 경도
  acc: number; // 위치 정확도(단위: m)
  tst: number; // 타임스탬프 (유닉스 시간)

  constructor(data: Partial<GpsData> = {}) {
    this.lat = data.lat ?? 0;
    this.lon = data.lon ?? 0;
    this.acc = data.acc ?? 0;
    this.tst = data.tst ?? 0;
  }
}
