import React from 'react';
import { Outlet } from 'react-router-dom';
import { BoardHeader } from 'features/board/ui/BoardHeader'; // Header 컴포넌트 경로에 맞게 수정
import { AsideBar } from 'features/board/ui/AsideBar';
import styles from './BoardLayout.module.scss'; // 레이아웃 스타일링

const BoardLayout: React.FC = () => {
  return (
    <div className={styles.layout}>
      <BoardHeader />
      <div className={styles.mainContent}>
        <div className={styles.aside}>
          <AsideBar />
        </div>
        <div className={styles.content}>
          <Outlet /> {/* 자식 라우트를 렌더링하는 Outlet */}
        </div>
      </div>
    </div>
  );
};

export default BoardLayout;
