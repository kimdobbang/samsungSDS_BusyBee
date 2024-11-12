// src/Login.tsx
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import { Hub } from '@aws-amplify/core';
import awsConfig from '../../../userPool';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { myTheme } from '../../../shared/theme/cognitoTheme';
import '@aws-amplify/ui-react/styles.css';
import './page.module.scss';
import { Dashboard } from 'features';
import { useAuth } from '../..';
import { ChatUI } from '../..';

// AWS Amplify 초기화
Amplify.configure({ ...awsConfig });

export const AuthUI: React.FC = () => {
  const [group] = useAuth() || [];
  const [content, setContent] = useState<JSX.Element | null>(null);
  const [stateChange, setStateChange] = useState<boolean>(false);

  useEffect(() => {
    const listener = (data: { payload: any }) => {
      const { payload } = data;
      if (payload.event === 'signedIn') {
        setStateChange(true);
      }
    };

    Hub.listen('auth', listener);

    return () => {
      Hub.listen('auth', listener); // 리스너 등록 해제
    };
  }, []);

  useEffect(() => {
    if (group !== undefined) {
      if (group?.includes('Admin')) {
        setContent(<Dashboard />);
      } else if (group?.includes('Users')) {
        setContent(<ChatUI />);
      }
    }
  }, [stateChange]);

  return (
    <div className='custom-authenticator' style={{ width: '100%', height: '100%' }}>
      <ThemeProvider theme={myTheme}>
        <Authenticator
          hideSignUp={false}
          formFields={{
            signUp: {
              username: {
                label: 'Username',
                placeholder: 'Enter your username',
                isRequired: true,
                order: 1,
              },
              email: {
                label: 'Email',
                placeholder: 'Enter your email',
                isRequired: true,
                order: 2,
              },
              password: {
                label: 'Password',
                placeholder: 'Enter your password',
                isRequired: true,
                order: 3,
              },
              confirm_password: {
                label: 'Confirm Password',
                placeholder: 'Re-enter your password',
                isRequired: true,
                order: 4,
              },
            },
          }}
        >
          {content}
        </Authenticator>
      </ThemeProvider>
    </div>
  );
};
