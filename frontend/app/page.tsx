'use client';

// import { Authenticator, ThemeProvider, Theme } from '@aws-amplify/ui-react';
import styles from './page.module.scss';
import React from 'react';
// import { Amplify } from 'aws-amplify';
// import awsConfig from '../userPool';
// import '@aws-amplify/ui-react/styles.css';
// import { Chat } from './chat/page';
//ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ

// AWS Amplify 초기화
// Amplify.configure({ ...awsConfig });

// // 커스텀 테마 정의
// const myTheme: Theme = {
//   name: 'my-theme',
//   tokens: {
//     colors: {
//       brand: {
//         primary: {
//           default: '#0078FF',
//         },
//       },
//     },
//     components: {
//       button: {
//         primary: {
//           backgroundColor: { value: '{colors.brand.primary.default}' },
//           color: { value: '#ffffff' },
//         },
//         link: {
//           color: { value: 'grey' },
//         },
//       },
//       tabs: {
//         item: {
//           _focus: {
//             color: { value: '{colors.brand.primary.default}' },
//             borderColor: { value: '{colors.brand.primary.default}' },
//           },
//           _active: {
//             color: { value: '{colors.brand.primary.default}' },
//             borderColor: { value: '{colors.brand.primary.default}' },
//           },
//         },
//       },
//     },
//   },
// };
//ㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡㅡ
const Home: React.FC = () => {
  // const [token, setToken] = useState<string | null>(null);

  // useEffect(() => {
  //   const keys = Object.keys(localStorage);

  //   const accessTokenKey = keys.find((key) => key.includes('accessToken'));

  //   if (accessTokenKey) {
  //     const storedToken = localStorage.getItem(accessTokenKey);
  //     setToken(storedToken);
  //   }
  // }, []);

  return (
    <div className={styles.customauthenticator}>
      1234
      {/* <ThemeProvider theme={myTheme}>
        <Authenticator hideSignUp={false}>
          {token ? <Chat /> : <p>일반사용자.</p>}
        </Authenticator>
      </ThemeProvider> */}
    </div>
  );
};
export default Home; // 기본 내보내기 확인
