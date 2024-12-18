export interface LoginRequestInterface {
  code: string;
}

export interface LoginResponseInterface {
  id: string;
  name: string;
  accessToken: string;
  refreshToken: string;
}

export interface CommonAuthorizationResponseInterface {
  uid: string;
  email: string;
  name: string;
  accessToken: string;
  refreshToken: string;
  type: 'google' | 'github' | 'linkedin';
}
