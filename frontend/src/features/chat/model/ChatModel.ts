export type MessageProps = {
  sender: string;
  content: string;
  time?: string;
};

export interface WebSocketMessage {
  action: string;
  orderId?: string;
  message?: string;
}

export interface UseWebSocketReturn {
  socket: WebSocket | null;
  sendMessage: (message: WebSocketMessage) => void;
}
