export type MessageProps = {
  sender: string;
  content: string;
  time?: string;
};

export interface WebSocketMessage {
  action?: string;
  orderId?: string;
  content?: string;
  message?: string;
  email?: string;
  senderType?: string;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  sendMessage: (message: WebSocketMessage) => void;
  receiveMessage: WebSocketMessage[];
}
