import { jwtDecode } from 'jwt-decode';
import { CustomJwtPayload } from '../model/AuthToken';

export function useAuth() {
  const getEmailFromIdToken = () => {
    const idTokenKey = Object.keys(localStorage).find((key) => key.includes('idToken'));
    if (!idTokenKey) {
      console.error('No idToken found in local storage.');
      return null;
    }

    const idToken = localStorage.getItem(idTokenKey);
    if (!idToken) {
      console.error('Token not found.');
      return null;
    }

    try {
      const decodedToken = jwtDecode<CustomJwtPayload>(idToken);
      const group = decodedToken['cognito:groups'];
      const email = decodedToken.email;

      const authInfo = [group, email];

      if (email && group) {
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
