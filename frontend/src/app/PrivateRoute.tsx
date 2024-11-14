import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from 'features/auth/hooks/useAuth'; // useAuth 훅의 경로는 프로젝트 구조에 맞게 수정하세요.

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const [group] = useAuth() || [];
  const location = useLocation();
  // 사용자가 인증되지 않았을 경우 / 경로로 리디렉션
  if (!group) {
    return <Navigate to='/' />;
  }

  // 사용자가 인증되지 않았을 경우 / 경로로 리디렉션
  if (group.length === 0) {
    return <Navigate to='/' />;
  }

  // group에 'Admin'이 포함되어 있지 않으면서 현재 경로가 /mail 또는 /mail/detail인 경우 /로 리디렉션
  if (
    !group.includes('Admin') &&
    (location.pathname === '/mail' || location.pathname === '/mail/detail')
  ) {
    return <Navigate to='/' />;
  }
  return children;
};

export default PrivateRoute;
