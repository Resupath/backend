export namespace DateTimeUtil {
  /**
   * 타임존을 포함한 시간을 반환한다.
   * @returns YYYY-MM-DDTHH:mm:ss.sssZ
   */
  export const now = () => {
    return new Date().toISOString();
  };

  /**
   * 날짜 간 개월수를 계산해 반환한다.
   *
   * @param startDate YYYY-MM-DD 형식의 문자열
   * @param endDate YYYY-MM-DD 형식의 문자열
   *
   * @example BetweenMonths("2024-10-01", "2024-10-31"); // 같은 달 -> 1
   * BetweenMonths("2024-10-01", "2024-12-01"); // 2
   * BetweenMonths("2024-10-31", "2025-01-01"); // 3
   * BetweenMonths("2022-05-15", "2024-06-20"); // 26
   */
  export const BetweenMonths = (startDate: string, endDate: string | null): number => {
    const start = new Date(startDate);
    const end = endDate ? new Date(endDate) : new Date();

    let months = (end.getFullYear() - start.getFullYear()) * 12 + (end.getMonth() - start.getMonth());

    // 같은 달이면 1개월로 처리
    if (months === 0) {
      return 1;
    }

    if (end.getDate() >= start.getDate()) {
      months += 1;
    }

    return months;
  };
}
