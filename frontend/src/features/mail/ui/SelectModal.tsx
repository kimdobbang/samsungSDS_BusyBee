import React from 'react';
import styles from './SelectModal.module.scss';
import { ModalProps } from '../model/ModalProps';
import { sendTagChange } from '../api/emailApi';
import { useAuth } from 'features/auth/hooks/useAuth';

export const SelectModal: React.FC<ModalProps> = ({
  selectedFlag,
  onClose,
  receivedDate,
  tagNum,
  onTagChange,
}) => {
  const [, receiver] = useAuth() || [];

  const handleTagChange = () => {
    if (
      typeof receiver === 'string' &&
      typeof receivedDate === 'string' &&
      typeof tagNum === 'number'
    ) {
      sendTagChange(receiver, receivedDate, tagNum)
        .then(() => {
          if (onTagChange) {
            onTagChange(tagNum);
          }
          onClose();
        })
        .catch((error) => {
          console.error('Error changing tag:', error);
        });
    } else {
      console.error('Invalid receiver type');
    }
  };

  return (
    <div className={styles.modalOverlay} onClick={onClose}>
      <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
        <p>
          {selectedFlag != null
            ? ` ${selectedFlag}(으)로 변경하시겠습니까? 변경 시 데이터 학습에 도움이 됩니다.`
            : '선택된 항목이 없습니다.'}
        </p>
        <div className={styles.modalButtons}>
          <button onClick={handleTagChange}>예</button>
          <button onClick={onClose}>아니오</button>
        </div>
      </div>
    </div>
  );
};
