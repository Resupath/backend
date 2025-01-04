import { tags } from 'typia';
import { User } from './user.interface';
import { Character } from './characters.interface';
import { Room } from './rooms.interface';

export interface Chat {
  id: string & tags.Format<'uuid'>;
  roomId: Room['id'];
  userId: User['id'] | null;
  characterId: Character['id'] | null;
  message: string & tags.MinLength<1>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Chat {
  /**
   * create
   */
  export interface CreateRequst extends Pick<Chat, 'characterId' | 'message'> {}

  export interface CreateResponse extends Pick<Chat, 'id' | 'message'> {}

  /**
   * get
   */
  export interface GetResponse extends Pick<Chat, 'id' | 'userId' | 'characterId' | 'message' | 'createdAt'> {}

  export interface GetAllResponse extends Array<Chat.GetResponse> {}
}
