import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';
import { Character } from './characters.interface';
import { Member } from './member.interface';

export interface Contacts {
  id: string & tags.Format<'uuid'>;
  memberId: Member['id'];
  characterId: Character['id'];
  purpose: string & tags.MinLength<1>;
  message: string & tags.MinLength<1>;
  status: 'pending' | 'completed' | 'rejected';
  createdAt: string & tags.Format<'date-time'>;
}

export namespace Contacts {
  /**
   * 연락하기 요청
   */
  export interface CreateRequst extends Pick<Contacts, 'purpose' | 'message'> {}

  /**
   * 연락하기 페이지 조회
   */
  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageData extends Omit<Contacts.GetResponse, 'memberId'> {
    member: {
      id: Member['id'];
      name: Member['name'];
    };
  }

  export interface GetByPageResponse extends PaginationUtil.Response<Contacts.GetByPageData> {}

  /**
   * 연락하기 조회
   */
  export interface GetResponse
    extends Pick<Contacts, 'id' | 'memberId' | 'characterId' | 'purpose' | 'message' | 'createdAt' | 'status'> {}
}
