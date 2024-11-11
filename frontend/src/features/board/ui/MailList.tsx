import React, { useEffect } from 'react';
import { ReactComponent as ReplyIcon } from 'shared/assets/icons/reply.svg';
import { ReactComponent as ArrowIcon } from 'shared/assets/icons/arrow.svg';
import { fetchEmailsByReceiver } from 'features/board/api/boardApi'; // API 호출 함수
import { Mail } from '@shared/types/board';
import styles from './MailList.module.scss';
import useMailStore from '../store/mailStore';
import { getNickname } from 'shared/utils/getNickname';
import { getTagColor, getTagName } from 'shared/utils/getTag';
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
        const data: Mail[] = await fetchEmailsByReceiver('test@busybeemail.net');

        // 메일 데이터를 파싱하여 nickname과 email 속성을 추가
        const parsedData = data.map((mail) => {
          const { nickname, email } = getNickname(mail.sender);
          return { ...mail, nickname, email };
        });

        setMails(parsedData); // 상태에 저장
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
    };

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
      <div className={styles.header}>
        <div className={styles.actions}>
          <input type='checkbox' />
        </div>
        <div className={styles.pageInfo}>
          <p>
            {mails.length}개 중 1-{mails.length}
          </p>
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
              <td className={styles.sender}>
                {mail.nickname} <br />
                {mail.email}
              </td>
              {/* 값이 제대로 렌더링되지 않으면 확인 */}
              <td className={styles.tag} style={{ backgroundColor: getTagColor(mail.flag) }}>
                {getTagName(mail.flag)}
              </td>
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
