// src/Login.tsx
import React, { useEffect, useState } from 'react';
import { Amplify } from 'aws-amplify';
import awsConfig from '../../../userPool';
import { Authenticator, ThemeProvider } from '@aws-amplify/ui-react';
import { myTheme } from '../../../shared/theme/cognitoTheme';
import '@aws-amplify/ui-react/styles.css';
import './page.module.scss';
import { useAuth } from '../..';
import { ChatUI } from '../..';
import { MailList } from '../..';
import BoardLayout from 'features/board/ui/BoardLayout';

// AWS Amplify 초기화
Amplify.configure({ ...awsConfig });

export const AuthUI: React.FC = () => {
  const [group] = useAuth() || [];
  const [content, setContent] = useState<JSX.Element | null>(null);

  useEffect(() => {
    if (group?.includes('Admin')) {
      setContent(<MailList />);
    } else if (group?.includes('Users')) {
      setContent(<ChatUI />);
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
          {content}
        </Authenticator>
      </ThemeProvider>
    </div>
  );
};
