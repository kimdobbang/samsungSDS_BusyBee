import React from 'react';
import { ReactComponent as StarIcon } from 'shared/assets/icons/star.svg';
import { ReactComponent as ReplyIcon } from 'shared/assets/icons/reply.svg';
import { ReactComponent as ArrowIcon } from 'shared/assets/icons/arrow.svg';
import { ReactComponent as LetterIcon } from 'shared/assets/icons/letterbox.svg';
import { emailMockData } from '../api/emailMockData';
import styles from './MailList.module.scss';

interface MailListProps {
  className?: string;
}

export const MailList: React.FC<MailListProps> = ({ className = '' }) => {
  return (
    <div className={`${styles.mailList} ${className}`}>
      <div className={styles.header}>
        <div className={styles.actions}>
          <input type='checkbox' />
          <button className={styles.button}>
            <ReplyIcon width={24} height={24} />
          </button>
        </div>
        <div className={styles.pageInfo}>
          <p>10000개 중 1-50</p>
          <button className={styles.navButton}>
            <ArrowIcon width={24} height={24} />
          </button>
          <button className={`${styles.navButton} ${styles.rotate}`}>
            <ArrowIcon width={24} height={24} />
          </button>
        </div>
      </div>
      <table className={styles.table}>
        <thead>
          <tr>
            <th> {''}</th>
            <th>보낸 사람</th>
            <th>태그</th>
            <th>제목</th>
            <th>보낸 시각</th>
          </tr>
        </thead>
        <tbody>
          {emailMockData.map((email) => (
            <tr key={email.Key}>
              <td>
                <input type='checkbox' />
              </td>
              <td className={styles.sender}>{email.senderName}</td>
              <td className={styles.tag}>{'견적요청'}</td>
              <td className={styles.subject}>
                <a href={`/board/mail/${email.Key}`}>{email.title} </a>
              </td>
              <td className={styles.timestamp}>
                {email.LastModified ? new Date(email.LastModified).toLocaleString() : 'Unknown'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};
