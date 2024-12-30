import { tags } from 'typia';
import { Character } from './characters.interface';
import { User } from './user.interface';

export interface Room {
  id: string & tags.Format<'uuid'>;
  userId: User['id'];
  characterId: Character['id'];
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Room {
  /**
   * create
   */
  export interface CreateRequest extends Pick<Room, 'characterId'> {}

  export interface CreateResponse extends Pick<Room, 'id'> {}
}
