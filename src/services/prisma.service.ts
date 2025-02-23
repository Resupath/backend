import { PrismaClient } from '@prisma/client';
import { Injectable, OnModuleInit } from '@nestjs/common';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  async onModuleInit() {
    await this.$connect();
  }

  /**
   * 기존 조회 결과와 새로운 데이터를 비교해 변경점이 있는지 확인한다.
   *
   * @param origin 기존 데이터들의 id 객체 배열
   * @param newData 신규 데이터들의 id 객체 배열
   */
  isChanged<T extends Record<'id', any>>(origin: Array<Pick<T, 'id'>>, newData: Array<Pick<T, 'id'>>): boolean {
    const originIds = new Set(origin.map((el) => el.id));
    const newIds = new Set(newData.map((el) => el.id));

    for (const id of newIds) {
      if (!originIds.has(id)) {
        return true;
      }
    }

    for (const id of originIds) {
      if (!newIds.has(id)) {
        return true;
      }
    }

    return false;
  }
}
