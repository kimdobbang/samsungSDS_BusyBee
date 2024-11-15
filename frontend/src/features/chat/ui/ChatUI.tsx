import { useEffect, useRef, useState } from 'react';
import styles from './ChatUI.module.scss';
import busybee2 from '../../../shared/assets/images/busybee2.png';
import busybee3 from '../../../shared/assets/images/busybee3.png';
import { ReactComponent as InfoIcon } from 'shared/assets/icons/info.svg';
import { MessageProps } from '../model/ChatModel';
import { Voice } from '../..';
import { useAuth } from '../..';
import useWebSocket from '../hooks/useWebSocket';
import { sendDataToLambda } from '../..';
import { useNavigate } from 'react-router-dom';
import { Tooltip } from 'features/tooltip/ui/Tooltip';

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
  const [viewId, setViewId] = useState<boolean>(false);

  console.log(useAuth());

  useEffect(() => {
    if (email && orderId) {
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
  }, [orderId, email, navigate]);

  useEffect(() => {
    const latestMessage = receiveMessage[receiveMessage.length - 1];
    if (latestMessage) {
      const newMessage: MessageProps = {
        sender: latestMessage.senderType === 'bot' ? 'admin' : 'user',
        content: latestMessage.message ?? '',
      };
      setMessages((prevMessages) => [...prevMessages, newMessage]);
    }
  }, [receiveMessage]);

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
      const message = { action: 'sendMessage', data: input };
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
          <img src={busybee3} alt='' height={55} />
          <h1>BUSYBEE</h1>
        </div>
        <div></div>
      </div>
      <div className={styles.userId}>
        {viewId ? email : null}
        <button onClick={() => setViewId(!viewId)} className={styles.userImage}>
          {(userId ?? 'BUSYBEE').slice(0, 5).toUpperCase()}
        </button>
        <Tooltip
          text='　　　　　　　　　　　　　　 챗봇과의 대화를 통해 빠르게 해결책을 찾을 수 있습니다．챗봇이 제공하는 안내를 따르며 대화를 이어가면， 자동화된 시스템이 신속하게 견적을 처리해 드릴 것입니다 　　　　　　　　　　　　　　 '
          position='left'
        >
          <InfoIcon />
        </Tooltip>
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
