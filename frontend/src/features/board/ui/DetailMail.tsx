// ./app/board/[id]/DetailMail.tsx
import { useSearchParams } from 'react-router-dom';
// import { ReactComponent as StarIcon } from 'shared/assets/icons/star.svg';
// import { ReactComponent as FaceIcon } from 'shared/assets/icons/face.svg';
// import { ReactComponent as ReplyIcon } from 'shared/assets/icons/reply.svg';
import busybee3 from 'shared/assets/images/busybee3.png';
import styles from './DetailMail.module.scss';
import useMailStore from '../utils/mailStore';
import { getTagColor, getTagName } from 'shared/utils/getTag';
import BoardLayout from './BoardLayout';

// interface MailDetails {
//   title: string;
//   senderName: string;
//   senderEmail: string;
//   body: string;
// }

export const DetailMail = () => {
  const [searchParams] = useSearchParams();
  const receiver = searchParams.get('receiver');
  const received_date = searchParams.get('received_date');

  // URL 인코딩된 received_date를 디코딩
  const decodedReceivedDate = received_date
    ? decodeURIComponent(received_date)
    : null;

  // receiver와 decodedReceivedDate가 null일 경우 빈 문자열로 처리
  const getMail = useMailStore((state) => state.getMail);

  // 디버깅: receiver와 decodedReceivedDate 값 출력
  console.log('Receiver from URL:', receiver);
  console.log('Received Date from URL (decoded):', decodedReceivedDate);

  // 디버깅: mails 배열 출력
  const mails = useMailStore((state) => state.mails);
  console.log('Current mails in store:', mails);

  const mailDetails =
    receiver && decodedReceivedDate
      ? getMail(receiver.trim(), decodedReceivedDate.trim())
      : null;

  // 디버깅: getMail 결과 출력
  console.log('getMails result:', mailDetails);

  // 메일을 찾지 못한 경우
  if (!receiver || !decodedReceivedDate || !mailDetails) {
    return <div>Invalid or missing email details</div>;
  }

  return (
    <BoardLayout>
      <div className={`${styles.detailMail}`}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <h1 style={{ backgroundColor: getTagColor(mailDetails.flag) }}>
              {getTagName(mailDetails.flag)}
            </h1>
            <h1>{mailDetails.subject}</h1>
          </div>

          <div className={styles.headerbuttons}>
            {/* <button className={styles.iconButton}>
            <StarIcon width={24} height={24} className={styles.icon} />
          </button>
          <button className={styles.iconButton}>
            <FaceIcon width={24} height={24} className={styles.icon} />
          </button>
          <button className={styles.iconButton}>
            <ReplyIcon width={24} height={24} className={styles.icon} />
          </button> */}
          </div>
        </div>
        <div className={styles.body}>
          <div className={styles.sender}>
            <button className={`${styles.button} ${styles.profile}`}>
              <img src={busybee3} alt='' height={40} />
            </button>
            <h2>{mailDetails.nickname}</h2>
            <h3>{mailDetails.email}</h3>
          </div>
          <div className={styles.content} style={{ whiteSpace: 'pre-wrap' }}>
            {mailDetails.emailContent}
          </div>
        </div>
      </div>
    </BoardLayout>
  );
};

export default DetailMail;
