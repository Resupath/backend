import { tags } from 'typia';

export interface Character {
  id: string & tags.Format<'uuid'>;
  memberId: string;
  nickname: string & tags.MinLength<1>;
  isPublic: boolean;
  createAt: Date;
  deleteAt: Date;
}

export namespace Character {
  export interface CreateRequest
    extends Pick<Character, 'nickname' | 'isPublic'> {}

  export interface CreateResponse extends Pick<Character, 'id'> {}

  export interface GetResponse
    extends Pick<
      Character,
      'id' | 'memberId' | 'nickname' | 'isPublic' | 'createAt'
    > {}
}
