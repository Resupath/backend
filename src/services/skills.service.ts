import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Skill } from 'src/interfaces/skills.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { PrismaService } from './prisma.service';

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

  async findOrCreateMany(body: Array<Skill.CreateRequest>): Promise<Array<Skill['id']>> {
    const date = DateTimeUtil.now();

    return await Promise.all(
      body.map(async (el) => {
        const skill = await this.get(el.keyword);

        if (!skill) {
          const newSkill = await this.prisma.skill.create({
            select: { id: true },
            data: {
              id: randomUUID(),
              keyword: el.keyword,
              created_at: date,
            },
          });

          return newSkill.id;
        }
        return skill.id;
      }),
    );
  }

  async get(keyword: Skill['keyword']): Promise<Skill.GetResponse | null> {
    return await this.prisma.skill.findFirst({
      select: { id: true, keyword: true },
      where: {
        keyword: keyword,
        deleted_at: null,
      },
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
