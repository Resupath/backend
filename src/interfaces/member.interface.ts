import { tags } from 'typia';
import { Provider } from './provider.interface';

export interface Member {
  id: string & tags.Format<'uuid'>;
  name: string & tags.MinLength<1>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Member {
  /**
   * get
   */
  export interface GetResponse extends Pick<Member, 'id' | 'name' | 'createdAt'> {
    providers: Array<Pick<Provider, 'id' | 'type' | 'createdAt'>>;
  }
}
