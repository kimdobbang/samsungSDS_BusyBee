import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from 'features/auth/hooks/useAuth'; // useAuth 훅의 경로는 프로젝트 구조에 맞게 수정하세요.

const PrivateRoute: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const [group] = useAuth() || [];

  // 사용자가 인증되지 않았을 경우 AuthUI로 리디렉션
  if (!group) {
    return <Navigate to='/authUI' />;
  }

  return children;
};

export default PrivateRoute;
