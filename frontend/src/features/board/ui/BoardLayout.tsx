import React from 'react';
// import { Outlet } from 'react-router-dom';
import { BoardHeader } from 'features/board/ui/BoardHeader'; // Header 컴포넌트 경로에 맞게 수정
import { AsideBar } from 'features/board/ui/AsideBar';
import styles from './BoardLayout.module.scss'; // 레이아웃 스타일링

interface BoardLayoutProps {
  children: React.ReactNode;
}

const BoardLayout: React.FC<BoardLayoutProps> = ({ children }) => {
  return (
    <div className={styles.layout}>
      <BoardHeader />
      <div className={styles.mainContent}>
        <div className={styles.aside}>
          <AsideBar />
        </div>
        <div className={styles.content}>
          {/* 자식 컴포넌트를 렌더링 */}
          {children}
        </div>
      </div>
    </div>
  );
};

export default BoardLayout;
