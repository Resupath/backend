import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Position } from 'src/interfaces/positions.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class PositionsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: Position.CreateRequest): Promise<Position.CreateResponse> {
    const data = DateTimeUtil.now();

    return await this.prisma.position.create({
      select: { id: true },
      data: { id: randomUUID(), keyword: body.keyword, created_at: data },
    });
  }

  async getByPage(
    query: Position.GetByPage,
  ): Promise<Position.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const whereInput: Prisma.PositionWhereInput | undefined = query.search
      ? { keyword: { contains: query.search } }
      : undefined;

    const [data, count] = await this.prisma.$transaction([
      this.prisma.position.findMany({
        select: { id: true, keyword: true },
        where: whereInput,
        skip,
        take,
      }),
      this.prisma.position.count({ where: whereInput }),
    ]);

    return PaginationUtil.createResponse({ data, count, skip, take });
  }
}
