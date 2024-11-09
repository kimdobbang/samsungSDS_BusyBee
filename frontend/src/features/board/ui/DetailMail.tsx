// ./app/board/[id]/DetailMail.tsx
import { useEffect, useState } from 'react';
import { ReactComponent as StarIcon } from 'shared/assets/icons/star.svg';
import { ReactComponent as FaceIcon } from 'shared/assets/icons/face.svg';
import { ReactComponent as ReplyIcon } from 'shared/assets/icons/reply.svg';
import busybee3 from 'shared/assets/images/busybee3.png';
import styles from './DetailMail.module.scss';
import { emailMockData } from '../api/emailMockData';

interface MailDetails {
  title: string;
  senderName: string;
  senderEmail: string;
  body: string;
}

interface DetailMailProps {
  id?: string;
  isAsideVisible?: boolean;
}

export const DetailMail = ({ id, isAsideVisible }: DetailMailProps) => {
  const [mailDetails, setMailDetails] = useState<MailDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadMailDetails() {
      try {
        setLoading(true);
        const details = await emailMockData[0];
        if (details) {
          setMailDetails(details);
        } else {
          setError('No email details found.');
        }
      } catch (err) {
        // TypeScript에서 err를 Error 타입으로 명시
        const errorMessage = err instanceof Error ? err.message : 'Failed to load email details';
        setError(errorMessage);
      } finally {
        setLoading(false);
      }
    }

    loadMailDetails();
  }, [id]);

  if (loading) {
    return <p>Loading...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  // mailDetails가 null이 아닐 때만 렌더링되도록 조건부 렌더링
  if (!mailDetails) {
    return null; // 또는 대체 내용을 표시할 수 있음
  }

  return (
    <div className={`${styles.detailMail} ${isAsideVisible ? styles.narrow : styles.wide}`}>
      <div className={styles.header}>
        <div className={styles.tag}>
          <h1>견적 요청 {id}</h1>
          <h1>{mailDetails.title}</h1>
        </div>
        <div className={styles.headerbuttons}>
          <button className={styles.iconButton}>
            <StarIcon width={24} height={24} className={styles.icon} />
          </button>
          <button className={styles.iconButton}>
            <FaceIcon width={24} height={24} className={styles.icon} />
          </button>
          <button className={styles.iconButton}>
            <ReplyIcon width={24} height={24} className={styles.icon} />
          </button>
        </div>
      </div>
      <div className={styles.body}>
        <div className={styles.sender}>
          <button className={`${styles.button} ${styles.profile}`}>
            <img src={busybee3} alt='' height={40} />
          </button>
          <h2>{mailDetails.senderName}</h2>
          <h3>{mailDetails.senderEmail}</h3>
        </div>
        <div className={styles.content}>{mailDetails.body}</div>
      </div>
    </div>
  );
};

export default DetailMail;
