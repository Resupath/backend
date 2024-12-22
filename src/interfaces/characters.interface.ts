import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';

export interface Character {
  id: string & tags.Format<'uuid'>;
  memberId: string;
  nickname: string & tags.MinLength<1>;
  isPublic: boolean;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Character {
  export interface CreateRequest
    extends Pick<Character, 'nickname' | 'isPublic'> {}

  export interface CreateResponse extends Pick<Character, 'id'> {}

  export interface GetResponse
    extends Pick<
      Character,
      'id' | 'memberId' | 'nickname' | 'isPublic' | 'createdAt'
    > {}

  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageData
    extends Pick<Character, 'id' | 'nickname' | 'createdAt'> {}

  export interface GetByPageResponse
    extends PaginationUtil.Response<GetByPageData> {}
}
