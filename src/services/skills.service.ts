import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CharacterSnapshot } from 'src/interfaces/characters.interface';
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

  async findOrCreateMany(body: Array<Skill.CreateRequest>): Promise<Array<Pick<Skill, 'id'>>> {
    const date = DateTimeUtil.now();
    const result: Array<Pick<Skill, 'id'>> = [];

    for (const el of body) {
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

        result.push({ id: newSkill.id });
      } else {
        result.push({ id: skill.id });
      }
    }

    return result;
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
      ? { keyword: { contains: query.search, mode: 'insensitive' } }
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

  /**
   * 캐릭터 스냅샷과의 스킬 관계를 추가한다.
   *
   * @param tx 프리즈마 트랜잭션 클라이언트 객체
   * @param characterSnapshotId 캐릭터 스냅샷 아이디
   * @param body 추가하려는 스킬 아이디
   */
  async updateSnapshotMany(
    tx: Prisma.TransactionClient,
    characterSnapshotId: CharacterSnapshot['id'],
    body: Array<Pick<Skill, 'id'>>,
  ): Promise<void> {
    const createInput = body.map((el): Prisma.Character_Snapshot_SkillCreateManyInput => {
      return {
        character_snapshot_id: characterSnapshotId,
        skill_id: el.id,
      };
    });

    await tx.character_Snapshot_Skill.createMany({ data: createInput });
  }
}
