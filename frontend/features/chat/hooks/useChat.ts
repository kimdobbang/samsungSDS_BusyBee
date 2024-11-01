import { useState } from 'react';

//추가로직 필요 틀만잡아논거임
export const useChat = () => {
  const [messages, setMessages] = useState<string[]>([]);

  const addMessage = (message: string) => {
    setMessages((prevMessages) => [...prevMessages, message]);
  };

  return { messages, addMessage };
};
