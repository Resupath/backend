import { tags } from 'typia';
import { Member } from './member.interface';

export interface User {
  id: string & tags.Format<'uuid'>;
  memberId: Member['id'];
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}
