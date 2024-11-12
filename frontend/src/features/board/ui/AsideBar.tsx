import { useNavigate } from 'react-router-dom';
import { ReactComponent as LetterIcon } from 'shared/assets/icons/letterbox.svg';
import { ReactComponent as DashBoardIcon } from 'shared/assets/icons/dashboard.svg';
import styles from './AsideBar.module.scss';
import useMailStore from 'features/board/utils/mailStore';

export const AsideBar: React.FC = () => {
  const navigate = useNavigate();
  const mails = useMailStore((state) => state.mails);
  return (
    <aside className={`${styles.aside} `}>
      <ul className={styles.list}>
        <li className={styles.item}>
          <button
            className={styles.button}
            onClick={() => navigate('/')} // 조건부 호출
          >
            <LetterIcon width={24} height={24} className={styles.icon} />
            <h1 className={styles.title}>편지함</h1>
            <p className={styles.count}>{mails.length}</p>
          </button>
        </li>
        <li className={styles.item}>
          <button
            className={styles.button}
            onClick={() => navigate('/dashboard')}
          >
            <DashBoardIcon width={24} height={24} className={styles.icon} />
            <h1 className={styles.title}>대시보드</h1>
            <p className={styles.count}></p>
          </button>
        </li>
      </ul>
    </aside>
  );
};
