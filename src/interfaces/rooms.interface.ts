import { tags } from 'typia';
import { User } from './user.interface';
import { Character } from './characters.interface';

export interface Room {
  id: string & tags.Format<'uuid'>;
  userId: User['id'];
  characterId: Character['id'];
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Room {}
