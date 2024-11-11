import styles from './page.module.scss';
import React from 'react';
<<<<<<< HEAD
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { AuthUI } from '../features';
=======

import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ChatUI, Home, DetailMail, MailList, Dashboard } from 'features';
import BoardLayout from 'features/board/ui/BoardLayout';
// import { Auth } from '../features';
>>>>>>> eaccedc30dd99865767d8531432a6919f8c1819d
// import { Voice } from '../features';

const App: React.FC = () => {
  return (
    <Router>
<<<<<<< HEAD
      <Routes>
        <Route path='/' element={<AuthUI />} />
        <Route path='/ChatUI' element={<AuthUI />} />
      </Routes>
=======
      <div className={styles.customauthenticator}>
        <Routes>
          {/* 홈 페이지 */}
          <Route path='/' element={<Home />} />

          {/* 채팅 페이지 */}
          <Route path='/chatUI' element={<ChatUI />} />

          {/* 게시판 관련 라우트 */}
          <Route path='/board' element={<BoardLayout />}>
            {/* /board → /board/mail로 리다이렉트 */}
            <Route index element={<Navigate to='mail' />} />

            {/* 메일 리스트 */}
            <Route path='mail' element={<MailList />} />

            {/* 메일 상세 페이지 */}
            <Route path='mail/:id' element={<DetailMail />} />

            {/* 대시보드 */}
            <Route path='dashboard' element={<Dashboard />} />
            <Route path='*' element={<div>404 - Page Not Found</div>} />
          </Route>
        </Routes>
      </div>
>>>>>>> eaccedc30dd99865767d8531432a6919f8c1819d
    </Router>
  );
};
export default App;
