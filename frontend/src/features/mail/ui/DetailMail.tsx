// ./app/board/[id]/DetailMail.tsx
import { useSearchParams } from 'react-router-dom';
// import { ReactComponent as StarIcon } from 'shared/assets/icons/star.svg';
// import { ReactComponent as FaceIcon } from 'shared/assets/icons/face.svg';
// import { ReactComponent as ReplyIcon } from 'shared/assets/icons/reply.svg';
import busybee3 from 'shared/assets/images/busybee3.png';
import styles from './DetailMail.module.scss';
import useMailStore from 'features/mail/utils/mailStore';
import { getTagColor, getTagName } from 'shared/utils/getTag';
import BoardLayout from 'shared/components/BoardLayout';
import { useEffect, useState } from 'react';
import { SelectModal } from './SelectModal';

export const DetailMail = () => {
  // URL에서 파라미터를 가져옴
  const [searchParams] = useSearchParams();
  const receiver = searchParams.get('receiver');
  const received_date = searchParams.get('received_date');
  const [showFlags, setShowFlags] = useState(false);
  const [flags, setFlags] = useState<number[]>([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedFlag, setSelectedFlag] = useState<number | null>(null);

  // URL 인코딩된 received_date를 디코딩
  const decodedReceivedDate = received_date
    ? decodeURIComponent(received_date)
    : null;

  // useMailStore로부터 상태 가져오기
  const getMail = useMailStore((state) => state.getMail);
  const mails = useMailStore((state) => state.mails);

  // 디버깅: 파라미터와 상태 출력
  console.log('Receiver from URL:', receiver);
  console.log('Received Date from URL (decoded):', decodedReceivedDate);
  console.log('Current mails in store:', mails);

  // 메일 상세 정보 가져오기
  const mailDetails =
    receiver && decodedReceivedDate
      ? getMail(receiver.trim(), decodedReceivedDate.trim())
      : null;

  useEffect(() => {
    if (mailDetails) {
      setFlags([0, 1, 2, 3].filter((flag) => flag !== mailDetails.flag));
    }
  }, [mailDetails]);

  // 디버깅: getMail 결과 출력
  console.log('getMails result:', mailDetails);

  // 메일 정보가 없을 경우 처리
  if (!receiver || !decodedReceivedDate || !mailDetails) {
    return <div>Invalid or missing email details</div>;
  }
  // S3 버킷 URL
  const S3_BUCKET_URL = 'https://mails-to-files.s3.amazonaws.com/';

  const toggleFlags = () => {
    setShowFlags((prevShowFlags) => !prevShowFlags);
    if (!showFlags) {
      setFlags([0, 1, 2, 3].filter((flag) => flag !== mailDetails.flag));
    } else {
      setFlags([]);
    }
  };
  const handleFlagClick = (flag: number) => {
    setSelectedFlag(flag);
    setModalOpen(true);
  };

  const handleTagChange = (tagNum: number) => {
    if (mailDetails) {
      mailDetails.flag = tagNum;
    }
  };

  const closeModal = () => {
    setModalOpen(false);
    setSelectedFlag(null);
  };
  return (
    <BoardLayout>
      <div className={styles.detailMail}>
        <div className={styles.header}>
          <div className={styles.tag}>
            <button className={styles.tagButton} onClick={toggleFlags}>
              <h1 style={{ backgroundColor: getTagColor(mailDetails.flag) }}>
                {getTagName(mailDetails.flag)}
              </h1>
            </button>
            {showFlags && (
              <div className={styles.flagsContainer}>
                {flags.map((flag) => (
                  <div
                    key={flag}
                    className={styles.flag}
                    style={{ backgroundColor: getTagColor(flag) }}
                    onClick={() => handleFlagClick(flag)}
                  >
                    {getTagName(flag)}
                  </div>
                ))}
              </div>
            )}
            <h1>{mailDetails.subject}</h1>
          </div>
          <div className={styles.headerbuttons}>
            {/* 아이콘 버튼들 주석 처리 */}
          </div>
        </div>
        <hr />
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
          <div className={styles.attachments}>
            <h3>[첨부파일]</h3>
            {mailDetails.attachments && mailDetails.attachments.length > 0 ? (
              <ul>
                {mailDetails.attachments.map((attachment, index) => {
                  // S3 주소와 파일명 분리
                  const [s3Path, fileName] = attachment.split('/');

                  // 전체 URL 생성
                  const downloadUrl = `${S3_BUCKET_URL}${attachment}`;

                  return (
                    <li key={index}>
                      <a href={downloadUrl} download={fileName}>
                        {fileName}
                      </a>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <p>첨부파일이 없습니다.</p>
            )}
          </div>
        </div>

        {modalOpen && (
          <SelectModal
            onClose={closeModal}
            selectedFlag={
              getTagName(selectedFlag !== null ? selectedFlag : 0) !== null
                ? getTagName(selectedFlag !== null ? selectedFlag : 0)
                : ''
            }
            receivedDate={decodedReceivedDate}
            tagNum={selectedFlag !== null ? selectedFlag : undefined}
            onTagChange={handleTagChange}
          />
        )}
      </div>
    </BoardLayout>
  );
};

export default DetailMail;
