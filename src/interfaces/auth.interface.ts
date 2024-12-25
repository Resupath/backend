import { tags } from 'typia';
import { Member } from './member.interface';
import { Provider } from './provider.interface';

export namespace Auth {
  export interface RefreshRequest {
    refreshToken: string & tags.MinLength<1>;
  }

  export interface LoginRequest {
    code: string & tags.MinLength<1>;
  }

  export interface LoginResponse {
    id: Member['id'];
    name: Member['name'];
    accessToken: string & tags.MinLength<1>;
    refreshToken: string & tags.MinLength<1>;
  }

  export interface CommonAuthorizationResponse {
    uid: Provider['uid'];
    name: Member['name'];
    email: string & tags.Format<'email'>;
    accessToken: string & tags.MinLength<1>;
    refreshToken: Provider['password'];
    type: Provider['type'];
  }
}
