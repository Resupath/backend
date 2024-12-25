import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';

export interface Position {
  id: string & tags.Format<'uuid'>;
  keyword: string & tags.MinLength<1>;
}

export namespace Position {
  /**
   * create
   */
  export interface CreateRequest extends Pick<Position, 'keyword'> {}
  export interface CreateResponse extends Pick<Position, 'id'> {}

  /**
   * get
   */
  export interface GetByPage extends PaginationUtil.Request {
    search?: string | null;
  }

  export interface GetResponse extends Pick<Position, 'id' | 'keyword'> {}

  export interface GetByPageResponse
    extends PaginationUtil.Response<Position.GetResponse> {}
}
