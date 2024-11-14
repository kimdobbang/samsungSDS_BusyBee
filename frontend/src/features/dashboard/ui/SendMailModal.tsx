import React, { useState } from 'react';
import { SendMailModalProps } from '../model/boardmodel';
import styles from './SendMailModal.module.scss';
import { sendDataToLambda } from '../api/dashboardApi';

export const SendMailModal: React.FC<SendMailModalProps> = ({
  showModal,
  onClose,
  orderId,
  sender,
  REreceiver,
  Weight,
  ContainerSize,
  DepartureDate,
  ArrivalDate,
  DepartureCity,
  ArrivalCity,
}) => {
  const [showCompletionModal, setShowCompletionModal] = useState(false);

  if (!showModal) return null;

  const text = `
  재요청 메일입니다.
  - 발신자: ${sender}
  - 수신자: ${REreceiver}
  - 무게: ${Weight}
  - 컨테이너 크기: ${ContainerSize}
  - 출발 날짜: ${DepartureDate}
  - 도착 날짜: ${ArrivalDate}
  - 출발 도시: ${DepartureCity}
  - 도착 도시: ${ArrivalCity}
  
  접속링크는 다음과 같습니다 접속링크를 통해 남은 견적을 입력해주세요
  https://busybeemail.net/chatUI?orderId=${orderId}
`;

  const handleSend = () => {
    sendDataToLambda(REreceiver, sender, text);
    setShowCompletionModal(true);
  };

  const closeCompletionModal = () => {
    setShowCompletionModal(false);
    onClose();
  };

  return (
    <>
      <div className={styles.overlay}>
        <div className={styles.modal}>
          <h1>재요청 메일</h1>
          <h3>
            - 발송자: <span>{sender}</span>
          </h3>
          <h3>
            - 수신자: <span>{REreceiver}</span>
          </h3>
          <h3>
            - 무게: <span>{Weight}</span>
          </h3>
          <h3>
            - 컨테이너 크기: <span>{ContainerSize}</span>
          </h3>
          <h3>
            - 출발 날짜: <span>{DepartureDate}</span>
          </h3>
          <h3>
            - 도착 날짜: <span>{ArrivalDate}</span>
          </h3>
          <h3>
            - 출발 도시: <span>{DepartureCity}</span>
          </h3>
          <h3>
            - 도착 도시: <span>{ArrivalCity}</span>
          </h3>
          <h3>
            - 접속 링크:{' '}
            <span>https://busybeemail.net/chatUI?orderId={orderId}</span>
          </h3>
          <div className={styles.buttonContainer}>
            <button onClick={handleSend} className={styles.sendButton}>
              보내기
            </button>
            <button onClick={onClose} className={styles.closeButton}>
              닫기
            </button>
          </div>
        </div>
      </div>

      {showCompletionModal && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h1>완료되었습니다.</h1>
            <div className={styles.buttonContainer}>
              <button
                onClick={closeCompletionModal}
                className={styles.closeButton}
              >
                확인
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
