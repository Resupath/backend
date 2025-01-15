import { tags } from 'typia';

export interface Experience {
  id: string & tags.Format<'uuid'>;
  companyName: string & tags.MinLength<1>;
  position: string & tags.MinLength<1>;
  startDate: string & tags.Format<'date'>;
  endDate: (string & tags.Format<'date'>) | null;
  description: string | null;
  sequence: number & tags.Minimum<0> & tags.Type<'int64'>;
  createdAt: string & tags.Format<'date-time'>;
  deletedAt: string & tags.Format<'date-time'>;
}

export namespace Experience {
  /**
   * create
   */
  export interface CreateRequest
    extends Pick<Experience, 'companyName' | 'position' | 'startDate' | 'endDate' | 'sequence'>,
      Partial<Pick<Experience, 'description'>> {}

  export interface CreateManyRequest {
    experiences: Array<CreateRequest> & tags.MinItems<1>;
  }

  /**
   * get
   */
  export interface GetResponse
    extends Pick<
      Experience,
      'id' | 'companyName' | 'position' | 'description' | 'startDate' | 'sequence' | 'endDate' | 'createdAt'
    > {}

  /**
   * update
   */
  export interface UpdateRequest extends Omit<CreateRequest, 'sequence'> {}

  export interface UpdateResponse extends Pick<Experience, 'id'> {}
}
