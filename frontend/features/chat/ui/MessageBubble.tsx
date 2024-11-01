import React from 'react';

//말풍선 꾸미세용
export const MessageBubble: React.FC<{ message: string }> = ({ message }) => {
  return <div className='message-bubble'>{message}</div>;
};
