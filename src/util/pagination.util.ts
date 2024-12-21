import { tags } from 'typia';

export namespace PaginationUtil {
  export interface Request {
    page?: number | null;
    limit?: number | null;
  }

  export interface Response<T> {
    data: T[] & tags.MinItems<0>;
    meta: {
      page: number & tags.Type<'int64'>;
      take: number & tags.Type<'int64'>;
      totalCount: number & tags.Type<'int64'>;
      totalPage: number & tags.Type<'int64'>;
    };
  }

  /**
   * 페이지네이션 계산 편의를 위한 함수이다.
   * @returns skip : 건너뛸 요소의 수, take: 이후 가져올 요소의 수
   */
  export function getOffset(input: Request): { skip: number; take: number } {
    const { page, limit } = input;

    const take = limit ?? 10;
    const pageToSkip = page ?? 0;
    const skip = pageToSkip > 1 ? take * (pageToSkip - 1) : 0;

    return { skip, take };
  }

  /**
   * 페이지네이션에서 전체페이지 계산을 위한 함수이다.
   *
   * @param totalCount 전체 요소의 수
   * @param limit 한번에 읽어올 요소의 수
   */
  export function getTotalPage(totalCount = 0, limit = 0): number {
    const totalPage =
      totalCount % limit === 0
        ? totalCount / limit
        : Math.floor(totalCount / limit) + 1;
    return totalPage;
  }

  /**
   * 페이지네이션 응답 형태를 만들기 위한 유틸 함수이다.
   */
  export function createPaginationResponse<T>(input: {
    data: T[];
    skip: number;
    count: number;
    take: number;
  }): Response<T> {
    return {
      data: input.data,
      meta: {
        page: input.skip / input.take + 1,
        take: input.take,
        totalCount: input.count,
        totalPage: getTotalPage(input.count, input.take),
      },
    };
  }
}
