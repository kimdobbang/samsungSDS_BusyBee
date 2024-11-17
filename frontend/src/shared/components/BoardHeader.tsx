// import { ReactComponent as MenuIcon } from 'shared/assets/icons/menu.svg';
// import { ReactComponent as SettingIcon } from 'shared/assets/icons/setting.svg';
import { ReactComponent as InfoIcon } from 'shared/assets/icons/info.svg';
// import { ReactComponent as FilterIcon } from 'shared/assets/icons/filter.svg';
// import { ReactComponent as SearchIcon } from 'shared/assets/icons/search.svg';
import busybee3 from 'shared/assets/images/busybee3.png';
import styles from './BoardHeader.module.scss';
import { useState } from 'react';
import { Tooltip } from 'features/tooltip/ui/Tooltip';

interface BoardHeaderProps {
  toggleAside?: () => void;
}

export const BoardHeader: React.FC<BoardHeaderProps> = ({ toggleAside }) => {
  const [modalOpen, setModalOpen] = useState(false);

  const logoutModalOpen = () => {
    setModalOpen(true);
  };

  const logout = () => {
    // logoutFunction();
    localStorage.clear();
    sessionStorage.clear();
    setModalOpen(false);

    window.location.reload();
  };

  return (
    <div className={styles.header}>
      <div className={styles.menu}>
        {/* <button className={`${styles.button} ${styles.menuIcon}`} onClick={toggleAside}>
          <MenuIcon width={24} height={24} />
        </button> */}
        <button className={`${styles.button} ${styles.logo}`}>
          <img src={busybee3} alt='' height={40} />
          <h1>BUSYBEE</h1>
        </button>
      </div>
      <div className={styles.actions}>
        {/* <button className={`${styles.button} ${styles.settingIcon}`}>
          <SettingIcon width={24} height={24} />
        </button> */}
        <Tooltip
          text='　　　　　　　　　　　　　　 요청 메일을 한눈에 확인하고, 견적 요청의 세부 정보와 진행 상태(요청, 주문, 운송, 완료)를 확인할 수 있으며, 현재 위치와 운송 상태도 실시간으로 볼 수 있습니다. 　　　　　　　　　　　　　　 '
          position='right'
        >
          <InfoIcon />
        </Tooltip>
        <button className={`${styles.button} ${styles.profile}`} onClick={logoutModalOpen}>
          <img src={busybee3} alt='' height={40} />
        </button>
      </div>
      {modalOpen && (
        <div className={styles.overlay}>
          <div className={styles.modal}>
            <h1>로그아웃하시겠습니까?</h1>
            <button className={styles.logoutbutton} onClick={logout}>
              로그아웃
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
