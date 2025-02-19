import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Personality } from 'src/interfaces/personalities.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class PersonalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 성격을 다수 생성합니다. (현재 어드민용)
   */
  async createBulk(body: Personality.CreateBulkRequest): Promise<void> {
    const { keywords } = body;
    const date = DateTimeUtil.now();

    await this.prisma.$transaction(async (tr) => {
      for (const keyword of keywords) {
        await tr.personality.updateMany({
          where: { keyword, deleted_at: null },
          data: { deleted_at: date },
        });

        await tr.personality.create({
          data: { id: randomUUID(), keyword, created_at: date },
        });
      }
    });
  }

  /**
   * 성격을 전체 조회합니다.
   */
  async getAll(): Promise<Array<Personality.GetResponse>> {
    const personalities = await this.prisma.personality.findMany({
      select: { id: true, keyword: true, created_at: true },
      where: { deleted_at: null },
      orderBy: { keyword: 'asc' },
    });

    /**
     * mapping
     */
    return personalities.map((el): Personality.GetResponse => {
      return { id: el.id, keyword: el.keyword, createdAt: el.created_at.toISOString() };
    });
  }

  /**
   * 성격을 페이지네이션으로 조회합니다.
   */
  async getByPage(query: Personality.GetByPageRequest): Promise<Personality.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);
    const whereInput: Prisma.PersonalityWhereInput = { deleted_at: null };

    const [personalities, count] = await this.prisma.$transaction([
      this.prisma.personality.findMany({
        select: { id: true, keyword: true, created_at: true },
        where: whereInput,
        orderBy: { keyword: 'asc' },
        skip,
        take,
      }),
      this.prisma.personality.count({ where: whereInput }),
    ]);

    /**
     * mapping
     */
    const data = personalities.map((el): Personality.GetResponse => {
      return { id: el.id, keyword: el.keyword, createdAt: el.created_at.toISOString() };
    });

    return PaginationUtil.createResponse({
      data,
      count,
      skip,
      take,
    });
  }

  /**
   * 캐릭터의 성격 정보를 수정한다.
   * 기존 데이터와 신규 데이터를 비교해 새로운 성격은 추가, 신규데이터에 없는 성격을 soft-del 처리한다.
   *
   * @param tx 프리즈마 트랜잭션 객체
   * @param characterId 변경할 캐릭터의 아이디
   * @param origin 기존 성격데이터들
   * @param newData 새로운 성격 데이터들
   * @param createdAt 트랜잭션 시작 시점
   */
  async updateAndDeleteMany(
    tx: Prisma.TransactionClient,
    characterId: Character['id'],
    origin: Array<Pick<Personality, 'id'>>,
    newData: Array<Pick<Personality, 'id'>>,
    createdAt: string,
  ): Promise<void> {
    // 아이디를 key로 map을 생성한다.
    const originMap = new Map(origin.map((el) => [el['id'], el]));
    const newDataMap = new Map(newData.map((el) => [el['id'], el]));

    // 1. 수정 처리
    for (const [key, newItem] of newDataMap.entries()) {
      if (!originMap.has(key)) {
        // 기존 데이터에 해당 id(key)가 없으면, 새로 캐릭터와의 관계를 생성한다.
        await tx.character_Personality.create({
          data: { character_id: characterId, personality_id: newItem.id, created_at: createdAt },
        });
      }
    }

    // 2. 삭제 처리
    for (const [key, originItem] of originMap.entries()) {
      if (!newDataMap.has(key)) {
        // 새로운 데이터 리스트에 없는 key는 삭제 처리한다.
        await tx.character_Personality.updateMany({
          where: { character_id: characterId, personality_id: originItem.id },
          data: { deleted_at: createdAt },
        });
      }
    }
  }
}
