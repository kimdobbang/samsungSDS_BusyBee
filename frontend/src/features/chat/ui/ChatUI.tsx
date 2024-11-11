import { useEffect, useRef, useState } from 'react';
import styles from './ChatUI.module.scss';
import busybee2 from '../../../shared/assets/images/busybee2.png';
import { MessageProps } from '../model/ChatModel';
import { Voice } from '../..';
import { useAuth } from '../..';
import useWebSocket from '../hooks/useWebSocket';
import { sendDataToLambda } from '../..';
import { useNavigate } from 'react-router-dom';

export const ChatUI = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<MessageProps[]>([]);
  const [input, setInput] = useState('');
  const chatRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [, authEmail] = useAuth() || [];
  const email = typeof authEmail === 'string' ? authEmail : '';
  const [isWebSocketConnected, setIsWebSocketConnected] = useState(false);
  const orderId = new URLSearchParams(window.location.search).get('orderId');
  const { sendMessage, receiveMessage } = useWebSocket(
    isWebSocketConnected ? orderId : null
  );
  const [isMessagesInitialized, setIsMessagesInitialized] = useState(false);

  useEffect(() => {
    if (orderId) {
      const fetchLambdaData = async () => {
        try {
          const res = await sendDataToLambda(orderId, email);
          console.log(res);

          if (res) {
            setIsWebSocketConnected(true);
          } else {
            console.log('세션 만료 - 로그아웃 및 리다이렉트');
            localStorage.clear();
            navigate('/');
          }
        } catch (error) {
          console.error('Error fetching data from Lambda:', error);
        }
      };

      fetchLambdaData();
    }
  }, [orderId]);

  useEffect(() => {
    if (
      !isMessagesInitialized &&
      receiveMessage &&
      receiveMessage.length >= 3
    ) {
      const newMessages: MessageProps[] = [
        { sender: 'admin', content: receiveMessage[0].message ?? '' },
        {
          sender: 'admin',
          content: receiveMessage[receiveMessage.length - 2].message ?? '',
        },
        {
          sender: 'admin',
          content: receiveMessage[receiveMessage.length - 1].message ?? '',
        },
      ];
      setMessages(newMessages);
      setIsMessagesInitialized(true); // 한 번 실행되었음을 기록
    }
  }, [receiveMessage, isMessagesInitialized]);

  useEffect(() => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.includes('signInDetails')) {
        const signInDetails = localStorage.getItem(key);
        if (signInDetails) {
          const details = JSON.parse(signInDetails);
          setUserId(details.loginId);
        }
        break;
      }
    }
    if (chatRef.current) {
      chatRef.current.scrollTop = chatRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.scrollLeft = inputRef.current.scrollWidth;
    }
  }, [input]);

  const handleSend = () => {
    if (input.trim()) {
      setMessages([...messages, { sender: 'user', content: input }]);
      const message = { action: 'sendMessage', message: input };
      sendMessage(message);
      setInput('');
    }
  };

  const handleTranscriptChange = (transcript: string, isFinal: boolean) => {
    if (isFinal) {
      setInput((prevInput) => prevInput + transcript);
    } else if (!isFinal) {
      setInput(transcript);
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.header}>
        <div></div>
        <div className={styles.middle}>
          <img src={busybee2} alt='' height={55} />
          <h1>BUSYBEE</h1>
        </div>
        <div></div>
      </div>
      <div className={styles.userId}>
        {userId}
        <img src={busybee2} alt='' height={45} />
      </div>
      <div className={styles.chat} ref={chatRef}>
        {messages.map((message, index) => (
          <div
            key={index}
            className={`${styles.messageContainer} ${styles[message.sender]}`}
          >
            {message.sender === 'admin' ? (
              <div className={styles.profileContainer}>
                <img src={busybee2} alt='' width={45} height={45} />
                <div className={`${styles.message} ${styles[message.sender]}`}>
                  {message.content}
                </div>
              </div>
            ) : (
              <div className={`${styles.message} ${styles[message.sender]}`}>
                {message.content}
              </div>
            )}
          </div>
        ))}
      </div>
      <div className={styles.textInput}>
        <input
          type='text'
          ref={inputRef} // inputRef 연결
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <div className={styles.button} onClick={handleSend}>
          보내기
        </div>
        <Voice onTranscriptChange={handleTranscriptChange} />
      </div>
      <div className={styles.warningMessage}>
        음성 녹음 시 대화가 초기화됩니다.
      </div>
    </div>
  );
};
