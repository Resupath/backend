export namespace DateTimeUtil {
  /**
   * 타임존을 포함한 시간을 반환한다.
   * @returns YYYY-MM-DDTHH:mm:ss.sssZ
   */
  export function now() {
    return new Date().toISOString();
  }
}
