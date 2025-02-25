import { PaginationUtil } from 'src/util/pagination.util';
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

  /**
   * get
   */

  export interface GetResponse extends Pick<Room, 'id' | 'createdAt'> {
    user: Pick<User, 'id'>;
    character: Pick<Character, 'id' | 'nickname' | 'image' | 'createdAt'>;
    /**
     * normal: 정상
     * deleted : 캐릭터가 삭제됨
     * changed: 캐릭터가 수정됨
     * private: 캐릭터가 비공개됨
     */
    status: 'normal' | 'private' | 'changed' | 'deleted';
  }

  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageResponse extends PaginationUtil.Response<Room.GetResponse> {}
}
