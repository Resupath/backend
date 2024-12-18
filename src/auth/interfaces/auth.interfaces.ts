export interface LoginResponseInterface {
  id: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

export interface CommonAuthorizationResponseInterface {
  uid: string;
  email: string;
  nickname: string;
  accessToken: string;
  refreshToken: string;
  type: 'google' | 'github' | 'linkedin';
}
