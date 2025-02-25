export namespace ObjectUtil {
  /**
   * 빈 객체인지 검증한다.
   */
  export const isEmpty = (obj: object) => Object.keys(obj).length === 0;

  /**
   * original의 키를 기준으로 순회하며 updated에 다른 내용이 있는지 확인한다.
   * 변경된 내용이 있다면 true, 없다면 false를 반환한다.
   *
   * @param original T → 원본 객체
   * @param updated Partial<T> → 수정된 객체 (일부 필드만 포함 가능)
   * @param keys 비교할 키의 목록
   */
  export function isChanged<T extends Record<string, any>>(
    original: T,
    updated: Partial<T>,
    keys: (keyof T)[] = [],
  ): boolean {
    const changedFields = getChangedFields(original, updated, keys);
    return isEmpty(changedFields) ? false : true;
  }

  /**
   * updated의 키를 기준으로 순회하며 original에 갱신된 내용이 있는지 확인한다.
   * 변경된 키와 값을 반환한다.
   *
   * @param original T → 원본 객체
   * @param updated Partial<T> → 수정된 객체 (일부 필드만 포함 가능)
   * @param keys 비교할 키의 목록
   */
  export function getChangedFields<T extends Record<string, any>>(
    original: T,
    updated: Partial<T>,
    keys: (keyof T)[] = [],
  ): Partial<T> {
    return Object.entries(updated).reduce((acc, [key, value]) => {
      if (keys.includes(key as keyof T) && original[key] !== value) {
        acc[key as keyof T] = value;
      }
      return acc;
    }, {} as Partial<T>);
  }
}
