import React, { useEffect } from 'react';
import { fetchEmailsByReceiver } from 'features/board/api/boardApi'; // API 호출 함수
import { Mail } from '@shared/types/board';
import styles from './MailList.module.scss';
import useMailStore from '../store/mailStore';

interface MailListProps {
  className?: string;
}

export const MailList: React.FC<MailListProps> = ({ className = '' }) => {
  // Zustand Store에서 상태 가져오기
  const mails = useMailStore((state) => state.mails);
  const setMails = useMailStore((state) => state.setMails);

  useEffect(() => {
    const loadMails = async () => {
      try {
        // API 호출하여 메일 데이터를 가져옵니다.
        const data: Mail[] = await fetchEmailsByReceiver('test@busybeemail.net');
        setMails(data); // 메일 데이터를 Zustand Store에 저장
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
    };

    // 메일 목록이 비어 있는 경우에만 데이터를 로드합니다.
    if (mails.length === 0) {
      loadMails();
    }
  }, [mails, setMails]);

  // 데이터 구조 확인을 위해 콘솔 로그 출력
  if (mails.length > 0) {
    console.log('MAILS: ', mails);
  }

  return (
    <div className={`${styles.mailList} ${className}`}>
      <table className={styles.table}>
        <thead>
          <tr>
            <th>{''}</th>
            <th>보낸 사람</th>
            <th>태그</th>
            <th>제목</th>
            <th>보낸 시각</th>
          </tr>
        </thead>
        <tbody>
          {mails.map((mail, index) => (
            <tr key={index}>
              <td>
                <input type='checkbox' />
              </td>
              <td className={styles.sender}>{mail.sender}</td>{' '}
              {/* 값이 제대로 렌더링되지 않으면 확인 */}
              <td className={styles.tag}>{mail.flag}</td>
              <td className={styles.subject}>
                <a
                  href={`/board/mail/detail?receiver=${mail.receiver}&received_date=${mail.received_date}`}
                >
                  {mail.subject}
                </a>
                {/* 값이 제대로 렌더링되지 않으면 확인 */}
              </td>
              <td className={styles.timestamp}>{mail.received_date || 'Unknown'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default MailList;
