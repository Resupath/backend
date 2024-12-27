import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';

export interface Skill {
  id: string & tags.Format<'uuid'>;
  keyword: string & tags.MinLength<1>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Skill {
  /**
   * create
   */
  export interface CreateRequest extends Pick<Skill, 'keyword'> {}

  export interface CreateResponse extends Pick<Skill, 'id'> {}

  /**
   * get
   */
  export interface GetByPage extends PaginationUtil.Request {
    search?: string | null;
  }

  export interface GetResponse extends Pick<Skill, 'id' | 'keyword'> {}

  export interface GetByPageResponse
    extends PaginationUtil.Response<Skill.GetResponse> {}
}
