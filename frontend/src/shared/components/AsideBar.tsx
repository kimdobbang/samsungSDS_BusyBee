import { useNavigate } from 'react-router-dom';
import { ReactComponent as LetterIcon } from 'shared/assets/icons/letterbox.svg';
import { ReactComponent as DashBoardIcon } from 'shared/assets/icons/dashboard.svg';
import styles from './AsideBar.module.scss';
import useMailStore from 'features/mail/utils/mailStore';
import { useEffect } from 'react';
import { fetchEmailsByReceiver, useAuth } from 'features';
import { getNickname } from 'shared/utils/getNickname';
import { sortMailsByReceivedDate } from 'features/mail/utils/sort';

export const AsideBar: React.FC = () => {
  const navigate = useNavigate();
  const mails = useMailStore((state) => state.mails);
  const setMails = useMailStore((state) => state.setMails);

  // useAuth 훅을 사용하여 이메일 가져오기
  const [, , loginId] = useAuth() || []; // 구조 분해 할당으로 이메일만 가져옴

  useEffect(() => {
    const loadMails = async () => {
      // email이 없으면 메일을 로드하지 않음
      if (!loginId) return;

      try {
        const receiver = loginId + '@busybeemail.net';
        const data = await fetchEmailsByReceiver(receiver || 'test@busybeemail.net');

        // API 응답 구조 출력
        // console.log('Fetched data:', data);

        // data가 배열인지 확인하고, 메일이 없는 경우 처리
        if (!Array.isArray(data)) {
          setMails([]); // 메일이 없는 경우 빈 배열로 설정
        } else {
          // 메일 데이터를 파싱하여 nickname과 email 속성을 추가
          const parsedData = data.map((mail) => {
            const { nickname, email } = getNickname(mail.sender);
            return { ...mail, nickname, email };
          });

          // 최신순으로 데이터 정렬
          const sortedData = sortMailsByReceivedDate(parsedData);
          setMails(sortedData); // 상태에 정렬된 데이터를 저장
        }
      } catch (error) {
        console.error('Error fetching emails:', error);
      }
    };

    // 컴포넌트가 마운트될 때 딱 한 번만 메일을 로드
    if (loginId) {
      loadMails();
    }
  }, [loginId]); // loginId 설정될 때만 호출

  return (
    <aside className={`${styles.aside} `}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <button
            className={styles.button}
            onClick={() => navigate('/mail')} // 조건부 호출
          >
            <div>
              <LetterIcon width={24} height={24} className={styles.icon} />
              <h1 className={styles.title}>편지함</h1>
            </div>
            <p className={styles.count}>{mails.length}</p>
          </button>
        </li>
        <li className={styles.item}>
          <button className={styles.button} onClick={() => navigate('/')}>
            <div>
              <DashBoardIcon width={24} height={24} className={styles.icon} />
              <h1 className={styles.title}>대시보드</h1>
            </div>
            <p className={styles.count}></p>
          </button>
        </li>
      </ul>
    </aside>
  );
};
