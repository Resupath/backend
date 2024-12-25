import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';

export interface Personality {
  id: string & tags.Format<'uuid'>;
  keyword: string & tags.MinLength<1>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Personality {
  /**
   * create
   */
  export interface CreateBulkRequest {
    keywords: Array<string> & tags.MinItems<0>;
  }

  export interface GetByPageRequest extends PaginationUtil.Request {}

  /**
   * get
   */
  export interface GetByPageData extends Pick<Personality, 'id' | 'keyword'> {}

  export interface GetByPageResonse
    extends PaginationUtil.Response<GetByPageData> {}
}
