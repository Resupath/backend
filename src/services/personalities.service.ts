import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
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
}
