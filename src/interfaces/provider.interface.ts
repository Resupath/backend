import { tags } from 'typia';
import { Member } from './member.interface';

export interface Provider {
  id: string & tags.Format<'uuid'>;
  memberId: Member['id'];
  type: ('google' | 'github' | 'linkedin' | 'notion') & tags.MinLength<1>;
  uid: string & tags.MinLength<1>;
  password: string & tags.MinLength<1>;
  createdAt: string & tags.Format<'date-time'>;
}
