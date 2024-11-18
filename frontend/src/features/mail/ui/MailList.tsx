import React, { useEffect, useState } from 'react';
// import { ReactComponent as ReplyIcon } from 'shared/assets/icons/reply.svg';
import { ReactComponent as ArrowIcon } from 'shared/assets/icons/arrow.svg';
import { fetchEmailsByReceiver } from 'features/mail/api/emailApi'; // API 호출 함수
import styles from './MailList.module.scss';
import useMailStore from 'features/mail/utils/mailStore';
import { getNickname } from 'shared/utils/getNickname';
import { getTagColor, getTagName } from 'shared/utils/getTag';
import BoardLayout from 'shared/components/BoardLayout';
import { useAuth } from 'features/auth/hooks/useAuth';
import { sortMailsByReceivedDate } from '../utils/sort';

interface MailListProps {
  className?: string;
}

export const MailList: React.FC<MailListProps> = ({ className = '' }) => {
  // Zustand Store에서 상태 가져오기
  const mails = useMailStore((state) => state.mails);
  const setMails = useMailStore((state) => state.setMails);

  const [selectedTag, setSelectedTag] = useState<number | null>(null);

  // 선택된 태그에 따라 메일 필터링
  const filteredMails =
    selectedTag !== null
      ? mails.filter((mail) => mail.flag === selectedTag)
      : mails;

  // 데이터 구조 확인을 위해 콘솔 로그 출력
  if (mails.length > 0) {
    console.log('MAILS: ', mails);
  }

  return (
    <BoardLayout>
      <div className={`${styles.mailList} ${className}`}>
        <div className={styles.header}>
          <div className={styles.actions}>
            <button
              className={`${styles.tagButton} ${
                selectedTag === 0 ? styles.active : ''
              }`}
              onClick={() => setSelectedTag(0)}
            >
              스팸
            </button>
            <button
              className={`${styles.tagButton} ${
                selectedTag === 1 ? styles.active : ''
              }`}
              onClick={() => setSelectedTag(1)}
            >
              주문
            </button>
            <button
              className={`${styles.tagButton} ${
                selectedTag === 2 ? styles.active : ''
              }`}
              onClick={() => setSelectedTag(2)}
            >
              견적
            </button>
            <button
              className={`${styles.tagButton} ${
                selectedTag === 3 ? styles.active : ''
              }`}
              onClick={() => setSelectedTag(3)}
            >
              기타
            </button>
            <button
              className={styles.tagButton}
              onClick={() => setSelectedTag(null)}
            >
              전체
            </button>
          </div>
          <div className={styles.pageInfo}>
            <p>
              {filteredMails.length}개 중 1-{filteredMails.length}
            </p>
            <button className={styles.navButton}>
              <ArrowIcon width={24} height={24} />
            </button>
            <button className={`${styles.navButton} ${styles.rotate}`}>
              <ArrowIcon width={24} height={24} />
            </button>
          </div>
        </div>
        {mails.length === 0 && <div>받은 메일이 없습니다.</div>}
        {mails.length !== 0 && (
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
              {filteredMails.map((mail, index) => (
                <tr
                  key={index}
                  className={mail.isRead ? styles.boardControl : ''}
                >
                  <td>
                    <input type='checkbox' />
                  </td>
                  <td className={styles.sender}>
                    {mail.nickname} <br />
                    {mail.email}
                  </td>
                  {/* 값이 제대로 렌더링되지 않으면 확인 */}
                  <td className={styles.tagCol}>
                    <div
                      style={{ backgroundColor: getTagColor(mail.flag) }}
                      className={styles.tag}
                    >
                      {getTagName(mail.flag)}
                    </div>
                  </td>
                  <td className={styles.subject}>
                    <a
                      href={`/mail/detail?receiver=${mail.receiver}&received_date=${mail.received_date}`}
                    >
                      {mail.subject}
                    </a>
                    {/* 값이 제대로 렌더링되지 않으면 확인 */}
                  </td>
                  <td className={styles.timestamp}>
                    {mail.received_date || 'Unknown'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </BoardLayout>
  );
};

export default MailList;
