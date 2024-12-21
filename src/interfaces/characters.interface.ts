import { tags } from 'typia';

export interface Character {
  id: string & tags.Format<'uuid'>;
  memberId: string & tags.MinLength<1>;
  nickname: string & tags.MinLength<1>;
  isPublic: boolean;
}

export namespace Character {
  export interface CreateCharacterRequest
    extends Pick<Character, 'nickname' | 'isPublic'> {}

  export interface CreateCharacterResponse extends Pick<Character, 'id'> {}
}
