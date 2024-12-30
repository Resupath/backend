import { tags } from 'typia';
import { Character } from './characters.interface';

export interface Source {
  id: string & tags.Format<'uuid'>;
  characterId: Character['id'];
  type: 'file' | 'link';
  subtype: string & tags.MinLength<1>;
  url: string & tags.Format<'uri'>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Source {
  /**
   * create
   */
  export interface CreateRequest
    extends Pick<Source, 'type' | 'subtype' | 'url'> {}

  export interface CreateResponse extends Pick<Source, 'id'> {}
}
