import { tags } from 'typia';

export namespace Files {
  /**
   * create
   */
  export interface CreateRequest {
    file: File;
  }
  export interface CreateResponse {
    url: string & tags.Format<'iri'>;
  }
}
