import styles from './page.module.scss';
import React from 'react';
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from 'react-router-dom';
import {
  ChatUI,
  Home,
  DetailMail,
  MailList,
  Dashboard,
  AuthUI,
  AnalysisGraph,
} from 'features';
import PrivateRoute from './PrivateRoute';
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
          {/* 보호된 경로 (PrivateRoute를 사용하여 보호) */}
          <Route
            path='mail'
            element={
              <PrivateRoute>
                <MailList />
              </PrivateRoute>
            }
          />
          <Route
            path='mail/detail'
            element={
              <PrivateRoute>
                <DetailMail />
              </PrivateRoute>
            }
          />
          <Route
            path='analysis'
            element={
              <PrivateRoute>
                <AnalysisGraph />
              </PrivateRoute>
            }
          />

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
