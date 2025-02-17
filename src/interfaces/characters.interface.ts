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
   * 스냅샷 생성 요청 객체
   */
  export interface CreateSnapshotRequest extends Pick<Character, 'nickname'>, Partial<Pick<Character, 'image'>> {}

  /**
   * 캐릭터 생성 요청 객체
   */
  export interface CreateRequest {
    character: Character.CreateSnapshotRequest & Pick<Character, 'isPublic'>;
    personalities: Array<Pick<Personality, 'id'>> & tags.MinItems<1>;
    experiences: Array<Pick<Experience, 'id'>> & tags.MinItems<1>;
    positions: Array<Position.CreateRequest> & tags.MinItems<1>;
    skills: Array<Skill.CreateRequest> & tags.MinItems<1>;
    sources: Array<Source.CreateRequest> & tags.MinItems<1>;
  }

  /**
   * 캐릭터 생성 응답 객체
   */
  export interface CreateResponse extends Pick<Character, 'id'> {}

  /**
   * 캐릭터 상세 조회 응답 객체
   */
  export interface GetResponse {
    character: Pick<Character, 'id' | 'memberId' | 'nickname' | 'image' | 'isPublic' | 'createdAt'>;
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

  /**
   * 캐릭터 페이지네이션 단일 객체
   */
  export interface GetBypageData
    extends Pick<
      GetResponse,
      'character' | 'personalities' | 'positions' | 'skills' | 'experienceYears' | 'roomCount'
    > {}

  /**
   * 캐릭터 페이지네이션 전체 응답 객체
   */
  export interface GetByPageResponse extends PaginationUtil.Response<Character.GetBypageData> {}

  /**
   * 캐릭터 수정 요청 객체 (현재 생성 객체랑 동일)
   */
  export interface UpdateRequest extends CreateRequest {}
}
