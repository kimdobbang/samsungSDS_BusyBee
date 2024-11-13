import { JwtPayload } from 'jwt-decode';

export interface CustomJwtPayload extends JwtPayload {
  email?: string;
  'cognito:groups'?: string[];
  'cognito:username'?: string;
}
