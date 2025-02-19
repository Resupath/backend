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

          return { id: newSkill.id };
        }
        return { id: skill.id };
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

  /**
   * 캐릭터의 기술스택을 수정한다.
   * 기존의 데이터와 신규 데이터를 비교해, 새로운 경력은 추가하고 목록에 없는 기술스택은 삭제한다.
   *
   * @param tx 프리즈마 트랜잭션 클라이언트 객체
   * @param characterSnapshotId 수정하려는 캐릭터 아이디
   * @param origin 기존의 경력 데이터들
   * @param newData 새로운 경력 데이터들
   * @param createdAt 스냅샷 생성 시점
   */
  async updateAndDeleteMany(
    tx: Prisma.TransactionClient,
    characterSnapshotId: CharacterSnapshot['id'],
    origin: Array<Pick<Skill, 'id'>>,
    newData: Array<Pick<Skill, 'id'>>,
  ) {
    // 아이디를 key로
    const originMap = new Map(origin.map((el) => [el['id'], el]));
    const newDataMap = new Map(newData.map((el) => [el['id'], el]));

    // 1. 수정 처리
    for (const [key, newItem] of newDataMap.entries()) {
      if (!originMap.has(key)) {
        // 기존 데이터에 해당 id(key)가 없으면, 새로 스냅샷과의 관계를 생성한다.
        await tx.character_Snapshot_Skill.create({
          data: { character_snapshot_id: characterSnapshotId, skill_id: newItem.id },
        });
      }
    }

    // 2. 삭제 처리
    for (const [key, originItem] of originMap.entries()) {
      if (!newDataMap.has(key)) {
        // 새로운 데이터 리스트에 없는 key는 삭제 처리
        await tx.character_Snapshot_Skill.deleteMany({
          where: { character_snapshot_id: characterSnapshotId, skill_id: originItem.id },
        });
      }
    }
  }
}
