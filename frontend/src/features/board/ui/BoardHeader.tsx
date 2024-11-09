// import { ReactComponent as MenuIcon } from 'shared/assets/icons/menu.svg';
// import { ReactComponent as SettingIcon } from 'shared/assets/icons/setting.svg';
import { ReactComponent as InfoIcon } from 'shared/assets/icons/info.svg';
import { ReactComponent as FilterIcon } from 'shared/assets/icons/filter.svg';
import { ReactComponent as SearchIcon } from 'shared/assets/icons/search.svg';
import busybee3 from 'shared/assets/images/busybee3.png';
import styles from './BoardHeader.module.scss';
import { useState } from 'react';

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
    setModalOpen(false);
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
      <div className={styles.search}>
        <SearchIcon width={24} height={24} />
        <input type='text' placeholder='메일 검색' className={styles.searchInput} />
        <button className={styles.filterButton}>
          <FilterIcon width={12} height={12} />
        </button>
      </div>
      <div className={styles.actions}>
        {/* <button className={`${styles.button} ${styles.settingIcon}`}>
          <SettingIcon width={24} height={24} />
        </button> */}
        <button className={`${styles.button} ${styles.infoIcon}`}>
          <InfoIcon width={24} height={24} />
        </button>
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
