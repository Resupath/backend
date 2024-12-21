import { tags } from 'typia';

export namespace Auth {
  export interface RefreshRequest {
    refreshToken: string;
  }

  export interface LoginRequest {
    code: string;
  }

  export interface LoginResponse {
    id: string & tags.Format<'uuid'>;
    name: string;
    accessToken: string;
    refreshToken: string;
  }

  export interface CommonAuthorizationResponse {
    uid: string;
    name: string;
    email: string & tags.Format<'email'>;
    accessToken: string;
    refreshToken: string;
    type: 'google' | 'github' | 'linkedin';
  }
}
