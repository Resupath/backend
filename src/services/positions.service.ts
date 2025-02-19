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

          return { id: newPosition.id };
        }
        return { id: position.id };
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

  /**
   * 캐릭터의 직종 정보를 수정한다.
   * 기존의 데이터와 신규 데이터를 비교해, 새로운 경력은 추가하고 목록에 없는 직종은 삭제한다.
   *
   * @param tx 프리즈마 트랜잭션 클라이언트 객체
   * @param characterSnapshotId 캐릭터 스냅샷 아이디
   * @param origin 기존의 직종 데이터들
   * @param newData 새로운 직종 데이터들
   */
  async updateAndDeleteMany(
    tx: Prisma.TransactionClient,
    characterSnapshotId: CharacterSnapshot['id'],
    origin: Array<Pick<Position, 'id'>>,
    newData: Array<Pick<Position, 'id'>>,
  ) {
    // 아이디를 key로
    const originMap = new Map(origin.map((el) => [el['id'], el]));
    const newDataMap = new Map(newData.map((el) => [el['id'], el]));

    // 1. 수정 처리
    for (const [key, newItem] of newDataMap.entries()) {
      if (!originMap.has(key)) {
        // 기존 데이터에 해당 id(key)가 없으면, 새로 스냅샷과의 관계를 생성한다.
        await tx.character_Snapshot_Position.create({
          data: { character_snapshot_id: characterSnapshotId, position_id: newItem.id },
        });
      }
    }

    // 2. 삭제 처리
    for (const [key, originItem] of originMap.entries()) {
      if (!newDataMap.has(key)) {
        // 새로운 데이터 리스트에 없는 key는 삭제 처리
        await tx.character_Snapshot_Position.deleteMany({
          where: { character_snapshot_id: characterSnapshotId, position_id: originItem.id },
        });
      }
    }
  }
}
