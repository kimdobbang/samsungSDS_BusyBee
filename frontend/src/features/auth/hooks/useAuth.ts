import { jwtDecode } from 'jwt-decode';
import { CustomJwtPayload } from '../model/AuthToken';

export function useAuth() {
  const getEmailFromIdToken = () => {
    const idTokenKey = Object.keys(localStorage).find((key) => key.includes('idToken'));
    if (!idTokenKey) {
      console.error('No idToken found in local storage.');
      return null;
    }

    // console.log('idTokenKey: ', idTokenKey);
    const idToken = localStorage.getItem(idTokenKey);

    if (!idToken) {
      console.error('Token not found.');
      return null;
    }

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(idToken);
      const group = decodedToken['cognito:groups'];
      const email = decodedToken.email;
      const loginId = decodedToken['cognito:username'];

      // console.log('Decoded Token, Login ID: ', loginId);

      // console.log('토큰, 그룹, 메일: ', decodedToken, group, email);
      const authInfo = [group, email, loginId];

      if (email && group && loginId) {
        return authInfo;
      } else {
        return null;
      }
    } catch (error) {
      return null;
    }
  };

  return getEmailFromIdToken();
}
