import { tags } from 'typia';

export namespace Character {
  export interface CreateRequest {
    nickname: string & tags.MinLength<1>;
    isPublic: boolean;
  }

  export interface CreateResponse {
    id: string & tags.Format<'uuid'>;
  }
}
