import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';

export interface Personality {
  id: string & tags.Format<'uuid'>;
  keyword: string & tags.MinLength<1>;
  createAt: Date;
  deleteAt: Date;
}

export namespace Personality {
  export interface GetByPageRequest extends PaginationUtil.Request {}

  export interface GetByPageResonse
    extends PaginationUtil.Response<Pick<Personality, 'id' | 'keyword'>> {}
}
