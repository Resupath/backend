import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Position } from 'src/interfaces/positions.interface';
import { DateTimeUtil } from 'src/util/datetime.util';
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

  async findOrCreateMany(body: Array<Position.CreateRequest>): Promise<Array<Position['id']>> {
    const date = DateTimeUtil.now();

    return await Promise.all(
      body.map(async (el) => {
        const position = await this.get(el.keyword);

        if (!position) {
          const newPosition = await this.prisma.position.create({
            select: { id: true },
            data: {
              id: randomUUID(),
              keyword: el.keyword,
              created_at: date,
            },
          });

          return newPosition.id;
        }
        return position.id;
      }),
    );
  }

  async get(keyword: Position['keyword']): Promise<Position.GetResponse | null> {
    return await this.prisma.position.findFirst({
      select: { id: true, keyword: true },
      where: {
        keyword: keyword,
        deleted_at: null,
      },
    });
  }

  async getByPage(query: Position.GetByPageRequest): Promise<Position.GetByPageResponse> {
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
