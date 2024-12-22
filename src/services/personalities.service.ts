import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Personality } from 'src/interfaces/personalities.interface';
import { Prisma } from '@prisma/client';
import { PaginationUtil } from 'src/util/pagination.util';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { randomUUID } from 'crypto';

@Injectable()
export class PersonalitiesService {
  constructor(private readonly prisma: PrismaService) {}

  async createBulk(body: Personality.CreateBulkRequest): Promise<void> {
    const { keywords } = body;
    const date = DateTimeUtil.now();

    this.prisma.$transaction(async (tr) => {
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

  async getByPage(
    query: Personality.GetByPageRequest,
  ): Promise<Personality.GetByPageResonse> {
    const { skip, take } = PaginationUtil.getOffset(query);
    const whereInput: Prisma.PersonalityWhereInput = { deleted_at: null };

    const [personalities, count] = await this.prisma.$transaction([
      this.prisma.personality.findMany({
        select: { id: true, keyword: true },
        where: whereInput,
        skip,
        take,
      }),
      this.prisma.personality.count({ where: whereInput }),
    ]);

    return PaginationUtil.createResponse({
      data: personalities,
      count,
      skip,
      take,
    });
  }
}
