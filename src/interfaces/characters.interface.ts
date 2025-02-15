import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';
import { Experience } from './experiences.interface';
import { Member } from './member.interface';
import { Personality } from './personalities.interface';
import { Position } from './positions.interface';
import { Skill } from './skills.interface';
import { Source } from './source.interface';

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
  export interface CreateRequest extends Pick<Character, 'nickname' | 'isPublic'>, Partial<Pick<Character, 'image'>> {
    personalities: Array<Pick<Personality, 'id'>> & tags.MinItems<1>;
    experiences: Array<Pick<Experience, 'id'>> & tags.MinItems<1>;
    positions: Array<Position.CreateRequest> & tags.MinItems<1>;
    skills: Array<Skill.CreateRequest> & tags.MinItems<1>;
    sources: Array<Source.CreateRequest> & tags.MinItems<1>;
  }

  export interface CreateResponse extends Pick<Character, 'id'> {}

  /**
   * get
   */
  export interface GetResponse
    extends Pick<Character, 'id' | 'memberId' | 'nickname' | 'image' | 'isPublic' | 'createdAt'> {
    personalities: Array<Pick<Personality, 'id' | 'keyword'>>;
    positions: Array<Pick<Position, 'id' | 'keyword'>>;
    skills: Array<Pick<Skill, 'id' | 'keyword'>>;
    sources: Array<Pick<Source, 'id' | 'type' | 'url' | 'subtype' | 'createdAt'>>;
    experiences: Array<Experience.GetResponse>;
    experienceYears: number & tags.Type<'int64'>;
    roomCount: number & tags.Type<'int64'>;
  }

  export interface GetByPageRequest extends PaginationUtil.Request {
    sort?: ('latest' | 'roomCount') | null;
    search?: Character['nickname'] | Position['keyword'] | Skill['keyword'] | null;
  }

  export interface GetBypageData
    extends Pick<
      GetResponse,
      | 'id'
      | 'memberId'
      | 'nickname'
      | 'image'
      | 'isPublic'
      | 'createdAt'
      | 'personalities'
      | 'positions'
      | 'skills'
      | 'experienceYears'
      | 'roomCount'
    > {}

  export interface GetByPageResponse extends PaginationUtil.Response<Character.GetBypageData> {}

  /**
   * update
   */
  export interface UpdateRequest extends Partial<Character.CreateRequest> {}
}
