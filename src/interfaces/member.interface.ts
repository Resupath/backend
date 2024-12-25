import { tags } from 'typia';

export interface Member {
  id: string & tags.Format<'uuid'>;
  name: string & tags.MinLength<1>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}
