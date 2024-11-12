import styles from './page.module.scss';
import React from 'react';

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatUI, Home, DetailMail, MailList, Dashboard, AuthUI } from 'features';
import BoardLayout from 'features/board/ui/BoardLayout';
// import { Auth } from '../features';
// import { Voice } from '../features';

const App: React.FC = () => {
  return (
    <Router>
      <div className={styles.customauthenticator}>
        <Routes>
          <Route path='/' element={<AuthUI />} />
          {/* 게시판 관련 라우트 */}

          {/* 메일 상세 페이지 (쿼리 파라미터 사용) */}
          <Route path='mail' element={<DetailMail />} />

          {/* 대시보드 */}
          <Route path='dashboard' element={<Dashboard />} />
          <Route path='*' element={<div>404 - Page Not Found</div>} />

          {/* 채팅 페이지 */}
          <Route path='/chatUI' element={<AuthUI />} />
          <Route path='/ChatUI' element={<AuthUI />} />
        </Routes>
      </div>
    </Router>
  );
};
export default App;
