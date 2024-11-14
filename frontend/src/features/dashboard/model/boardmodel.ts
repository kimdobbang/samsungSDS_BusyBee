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
