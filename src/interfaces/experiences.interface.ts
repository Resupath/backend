import { tags } from 'typia';

export interface Experience {
  id: string & tags.Format<'uuid'>;
  companyName: string & tags.MinLength<1>;
  position: string & tags.MinLength<1>;
  startDate: string & tags.Format<'date'>;
  endDate: string & tags.Format<'date'>;
  description: string | null;
  // sequence: number
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Experience {
  export interface CreateData
    extends Pick<
      Experience,
      'companyName' | 'position' | 'startDate' | 'endDate'
    > {
    description?: Experience['description'];
  }

  export interface CreateRequest {
    experiences: CreateData[] & tags.MinItems<1>;
  }

  export interface GetResponse
    extends Pick<
      Experience,
      | 'id'
      | 'companyName'
      | 'position'
      | 'startDate'
      | 'endDate'
      | 'description'
    > {}
}
