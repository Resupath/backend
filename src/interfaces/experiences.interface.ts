import { tags } from 'typia';

export interface Experience {
  id: string & tags.Format<'uuid'>;
  companyName: string & tags.MinLength<1>;
  position: string & tags.MinLength<1>;
  startDate: string & tags.Format<'date'>;
  endDate: string & tags.Format<'date'>;
  description: string | null;
  sequence: number & tags.Minimum<0> & tags.Type<'int64'>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Experience {
  export interface CreateData
    extends Pick<
      Experience,
      'companyName' | 'position' | 'startDate' | 'endDate' | 'sequence'
    > {
    description?: Experience['description'];
  }

  export interface CreateRequest {
    experiences: Array<CreateData> & tags.MinItems<1>;
  }

  export interface GetResponse
    extends Pick<
      Experience,
      | 'id'
      | 'companyName'
      | 'position'
      | 'description'
      | 'startDate'
      | 'sequence'
    > {
    endDate?: Experience['endDate'] | null;
  }

  export interface GetAllResponse extends Array<GetResponse> {}
}
