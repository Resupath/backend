import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';
import { Experience } from './experiences.interface';
import { Member } from './member.interface';
import { Personality } from './personalities.interface';

export interface Character {
  id: string & tags.Format<'uuid'>;
  memberId: Member['id'];
  nickname: string & tags.MinLength<1>;
  image: (string & tags.MinLength<1>) | null;
  isPublic: boolean;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Character {
  /**
   * create
   */
  export interface CreateRequest
<<<<<<< HEAD
    extends Pick<Character, 'nickname' | 'isPublic' | 'position'>,
      Partial<Pick<Character, 'image'>> {
=======
    extends Pick<Character, 'nickname' | 'isPublic'> {
    image?: Character['image'];
>>>>>>> b39d0f3 (feat: Position 스키마 정의 추가)
    personalities: Array<Personality['id']> & tags.MinItems<1>;
    experiences: Array<Experience['id']> & tags.MinItems<1>;
  }

  export interface CreateResponse extends Pick<Character, 'id'> {}

  /**
   * get
   */
  export interface GetResponse
    extends Pick<
      Character,
      'id' | 'memberId' | 'nickname' | 'image' | 'isPublic' | 'createdAt'
    > {
    personalities: Array<Personality['keyword']>;
  }

  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageData
    extends Pick<Character, 'id' | 'nickname' | 'createdAt'> {}

  export interface GetByPageResponse
    extends PaginationUtil.Response<GetByPageData> {}
}
