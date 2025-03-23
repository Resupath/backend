import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CharacterSnapshot } from 'src/interfaces/characters.interface';
import { Position } from 'src/interfaces/positions.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
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

  async findOrCreateMany(body: Array<Position.CreateRequest>): Promise<Array<Pick<Position, 'id'>>> {
    const date = DateTimeUtil.now();
    const result: Array<Pick<Position, 'id'>> = [];

    for (const el of body) {
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

        result.push({ id: newPosition.id });
      } else {
        result.push({ id: position.id });
      }
    }

    return result;
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
      ? { keyword: { contains: query.search, mode: 'insensitive' } }
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

  /**
   * 캐릭터 스냅샷과의 직군 관계를 추가한다.
   *
   * @param tx 프리즈마 트랜잭션 클라이언트 객체
   * @param characterSnapshotId 캐릭터 스냅샷 아이디
   * @param body 추가하려는 직군 아이디
   */
  async updateSnapshotMany(
    tx: Prisma.TransactionClient,
    characterSnapshotId: CharacterSnapshot['id'],
    body: Array<Pick<Position, 'id'>>,
  ): Promise<void> {
    const createInput = body.map((el): Prisma.Character_Snapshot_PositionCreateManyInput => {
      return {
        character_snapshot_id: characterSnapshotId,
        position_id: el.id,
      };
    });

    await tx.character_Snapshot_Position.createMany({ data: createInput });
  }
}
