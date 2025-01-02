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

  /**
   * get
   */
  export interface PresignedRequest {
    key: string & tags.MinLength<1>;
  }

  export interface PresignedResponse {
    url: string & tags.MinLength<1>;
  }
}
