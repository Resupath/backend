import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Skill } from 'src/interfaces/skills.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { PrismaService } from './prisma.service';
import { PaginationUtil } from 'src/util/pagination.util';
import { Prisma } from '@prisma/client';

@Injectable()
export class SkillsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(body: Skill.CreateRequest): Promise<Skill.CreateResponse> {
    const date = DateTimeUtil.now();

    return await this.prisma.skill.create({
      select: { id: true },
      data: { id: randomUUID(), keyword: body.keyword, created_at: date },
    });
  }

  async getByPage(query: Skill.GetByPage): Promise<Skill.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const whereInput: Prisma.SkillWhereInput | undefined = query.search
      ? { keyword: { contains: query.search } }
      : undefined;

    const [data, count] = await this.prisma.$transaction([
      this.prisma.skill.findMany({
        select: { id: true, keyword: true },
        where: whereInput,
        skip,
        take,
      }),

      this.prisma.skill.count({ where: whereInput }),
    ]);

    return PaginationUtil.createResponse({
      data,
      count,
      skip,
      take,
    });
  }
}
