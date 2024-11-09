import { useEffect, useState } from 'react';
import { WebSocketMessage, UseWebSocketReturn } from '../model/ChatModel';
import { getWebSocketUrl } from '../api/chatApi';

function useWebSocket(orderId: string | null): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const url = getWebSocketUrl(orderId);

  useEffect(() => {
    if (!url) return;

    const webSocket = new WebSocket(url);

    webSocket.onopen = () => {
      console.log('WebSocket connection opened');
      const initialMessage: WebSocketMessage = {
        action: 'sendOrderData',
        orderId: orderId || '',
      };
      console.log(1);
      webSocket.send(JSON.stringify(initialMessage));
      console.log(2);
    };

    webSocket.onmessage = (event: MessageEvent) => {
      console.log(event);
      const data: WebSocketMessage = JSON.parse(event.data);
      console.log('Message received from server:', data);
    };

    webSocket.onclose = () => {
      console.log('WebSocket connection closed');
    };

    webSocket.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    setSocket(webSocket);

    return () => {
      webSocket.close();
    };
  }, [url]);

  const sendMessage = (message: WebSocketMessage) => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify(message));
    } else {
      console.error('WebSocket is not open. Cannot send message.');
    }
  };

  return { socket, sendMessage };
}

export default useWebSocket;
