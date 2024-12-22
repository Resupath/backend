import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';
import { Personality } from './personalities.interface';

export interface Character {
  id: string & tags.Format<'uuid'>;
  memberId: string & tags.Format<'uuid'>;
  nickname: string & tags.MinLength<1>;
  image: (string & tags.MinLength<1>) | null;
  isPublic: boolean;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Character {
  export interface CreateRequest
    extends Pick<Character, 'nickname' | 'isPublic'> {
    image?: Character['image'];
    personalities: Personality['id'][] & tags.MinItems<1>;
  }

  export interface CreateResponse extends Pick<Character, 'id'> {}

  export interface GetResponse
    extends Pick<
      Character,
      'id' | 'memberId' | 'nickname' | 'image' | 'isPublic' | 'createdAt'
    > {
    personality: Personality['keyword'][];
  }

  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageData
    extends Pick<Character, 'id' | 'nickname' | 'createdAt'> {}

  export interface GetByPageResponse
    extends PaginationUtil.Response<GetByPageData> {}
}
