import { Member } from './member.interface';
import { User } from './user.interface';

export namespace Guard {
  export interface UserResponse {
    id: User['id'];
  }

  export interface MemberResponse {
    id: Member['id'];
  }
}
