import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';
import { Personality } from './personalities.interface';
import { Experience } from './experiences.interface';

export interface Character {
  id: string & tags.Format<'uuid'>;
  memberId: string & tags.Format<'uuid'>;
  nickname: string & tags.MinLength<1>;
  position: string & tags.MinLength<1>;
  image: (string & tags.MinLength<1>) | null;
  isPublic: boolean;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Character {
  export interface CreateRequest
    extends Pick<Character, 'nickname' | 'isPublic' | 'position'> {
    image?: Character['image'];
    personalities: Array<Personality['id']> & tags.MinItems<1>;
    experiences: Array<Experience['id']> & tags.MinItems<1>;
  }

  export interface CreateResponse extends Pick<Character, 'id'> {}

  export interface GetResponse
    extends Pick<
      Character,
      | 'id'
      | 'memberId'
      | 'nickname'
      | 'position'
      | 'image'
      | 'isPublic'
      | 'createdAt'
    > {
    personality: Array<Personality['keyword']>;
  }

  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageData
    extends Pick<Character, 'id' | 'nickname' | 'createdAt'> {}

  export interface GetByPageResponse
    extends PaginationUtil.Response<GetByPageData> {}
}
