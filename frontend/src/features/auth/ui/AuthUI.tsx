// src/Login.tsx
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import awsConfig from '../../../userPool';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { myTheme } from '../../../shared/theme/cognitoTheme';
import '@aws-amplify/ui-react/styles.css';
import './page.module.scss';

// AWS Amplify 초기화
Amplify.configure({ ...awsConfig });

export const AuthUI: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    const keys = Object.keys(localStorage);

    const accessTokenKey = keys.find((key) => key.includes('accessToken'));

    if (accessTokenKey) {
      const storedToken = localStorage.getItem(accessTokenKey);
      setToken(storedToken);
    }
  }, []);

  return (
    <div className='custom-authenticator'>
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
          {token ? <p>Access Token: 어드민유저</p> : <p>일반사용자.</p>}
        </Authenticator>
      </ThemeProvider>
    </div>
  );
};
