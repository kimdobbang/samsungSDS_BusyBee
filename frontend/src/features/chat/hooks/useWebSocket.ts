import { useEffect, useState } from 'react';
import { WebSocketMessage, UseWebSocketReturn } from '../model/ChatModel';
import { getWebSocketUrl } from '../api/chatApi';

function useWebSocket(orderId: string | null): UseWebSocketReturn {
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const url = getWebSocketUrl(orderId);
  const [receiveMessage, setReceiveMessage] = useState<WebSocketMessage[]>([]);

  useEffect(() => {
    if (!url) return;

    const webSocket = new WebSocket(url);

    webSocket.onopen = () => {
      console.log('WebSocket connection opened');
    };

    webSocket.onmessage = (event: MessageEvent) => {
      const data: WebSocketMessage = JSON.parse(event.data);
      setReceiveMessage((prevMessages) => [...prevMessages, data]);
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
      console.log(socket);
    } else {
      console.error('WebSocket is not open. Cannot send message.');
    }
  };

  return { socket, sendMessage, receiveMessage };
}

export default useWebSocket;
