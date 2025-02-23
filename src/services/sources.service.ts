import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Member } from 'src/interfaces/member.interface';
import { Source } from 'src/interfaces/source.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { ObjectUtil } from 'src/util/object.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 캐릭터의 소스를 생성한다.
   */
  async create(characterId: Source['characterId'], body: Source.CreateRequest): Promise<Source.GetResponse> {
    const date = DateTimeUtil.now();

    const source = await this.prisma.source.create({
      select: { id: true, type: true, subtype: true, url: true, created_at: true },
      data: {
        id: randomUUID(),
        character_id: characterId,
        type: body.type,
        subtype: body.subtype,
        url: body.url,
        created_at: date,
      },
    });

    return this.mapping(source);
  }

  /**
   * 캐릭터의 소스를 조회 및 생성한다.
   * type, url 정보가 같은 소스가 있는지 조회하고 없다면 새로 생성, 있다면 id를 반환한다.
   */
  async findOrCreateMany(
    characterId: Character['id'],
    body: Array<Source.CreateRequest>,
  ): Promise<Array<Pick<Source, 'id'>>> {
    const date = DateTimeUtil.now();

    return await Promise.all(
      body.map(async (el) => {
        const source = await this.prisma.source.findMany({
          select: {
            id: true,
            type: true,
            subtype: true,
            url: true,
            created_at: true,
          },
          where: { character_id: characterId, type: el.type, url: el.url, deleted_at: null },
        });

        if (!source.length) {
          const newSource = await this.prisma.source.create({
            select: { id: true },
            data: {
              id: randomUUID(),
              character_id: characterId,
              type: el.type,
              subtype: el.subtype,
              url: el.url,
              created_at: date,
            },
          });

          return { id: newSource.id };
        }
        return { id: source.at(0)?.id as string };
      }),
    );
  }

  /**
   * 캐릭터의 소스를 여러개 생성한다.
   */
  async createMany(characterId: string, body: Array<Source.CreateRequest>): Promise<Source.GetAllResponse> {
    const date = DateTimeUtil.now();

    const createInput = body.map((el): Prisma.SourceCreateManyInput => {
      return {
        id: randomUUID(),
        character_id: characterId,
        type: el.type,
        subtype: el.subtype,
        url: el.url,
        created_at: date,
      };
    });

    const data = await this.prisma.source.createManyAndReturn({
      select: { id: true, type: true, subtype: true, url: true, created_at: true },
      data: createInput,
    });

    /**
     * mapping
     */
    const sources = data.map((el): Source.GetResponse => this.mapping(el));

    return { characterId, sources };
  }

  /**
   * 캐릭터에 저장된 특정 소스를 조회합니다.
   * @param characterId 캐릭터의 아이디
   * @param id 소스의 아이디
   * @param option 조회 옵셔널 파라미터 입니다. 다음과 같습니다.
   *   - memberId: 특정 멤버에 저장되어있는 소스를 조회하려면, 값으로 아이디를 입력합니다.
   */
  async get(
    characterId: Source['characterId'],
    id: Source['id'],
    option?: { memberId?: Member['id'] },
  ): Promise<Source.GetResponse> {
    const whereInput: Prisma.SourceWhereUniqueInput = {
      id,
      character_id: characterId,
      deleted_at: null,
      ...(option?.memberId ? { character: { member_id: option.memberId } } : undefined),
    };

    const source = await this.prisma.source.findUnique({
      select: {
        id: true,
        type: true,
        subtype: true,
        url: true,
        created_at: true,
      },
      where: whereInput,
    });

    if (!source) {
      throw new NotFoundException('존재하지 않는 첨부파일 입니다.');
    }

    return this.mapping(source);
  }

  /**
   * 소스를 수정한다. 변경된 내용이 있을때만 수정한다.
   */
  async update(
    memberId: Member['id'],
    characterId: Source['characterId'],
    id: Source['id'],
    body: Source.UpdateRequest,
  ): Promise<Source.GetResponse | null> {
    const source = await this.get(characterId, id, { memberId: memberId });
    const isChanged = ObjectUtil.isChanged(source, body, ['type', 'subtype', 'url']);

    if (!isChanged) {
      return null;
    }

    const updatedSource = await this.prisma.source.update({
      select: {
        id: true,
        type: true,
        subtype: true,
        url: true,
        created_at: true,
      },
      where: { id: id },
      data: {
        type: body.type,
        subtype: body.subtype,
        url: body.url,
      },
    });

    return this.mapping(updatedSource);
  }

  /**
   * 소스를 삭제한다.
   */
  async delete(memberId: Member['id'], characterId: Source['characterId'], id: Source['id']): Promise<void> {
    const date = DateTimeUtil.now();
    await this.get(characterId, id, { memberId: memberId });

    await this.prisma.source.update({
      select: {
        id: true,
        type: true,
        subtype: true,
        url: true,
        created_at: true,
      },
      where: { id: id },
      data: {
        deleted_at: date,
      },
    });
  }

  /**
   * 캐릭터의 첨부파일을 삭제한다.
   * 기존의 데이터와 신규 데이터를 비교해, 사라진 첨부파일을 삭제한다.
   *
   * @param tx 프리즈마 트랜잭션 클라이언트 객체
   * @param characterId 수정하려는 캐릭터 아이디
   * @param origin 기존의 첨부파일 데이터들
   * @param newData 새로운 첨부파일 데이터들
   * @param createdAt 트래잭션 시작 시점
   */
  async deleteMany(
    tx: Prisma.TransactionClient,
    characterId: Character['id'],
    origin: Array<Pick<Source, 'id'>>,
    newData: Array<Pick<Source, 'id'>>,
    createdAt: string,
  ) {
    // 아이디를 key로 map 생성
    const originMap = new Map(origin.map((el) => [el['id'], el]));
    const newDataMap = new Map(newData.map((el) => [el['id'], el]));

    // 삭제 처리
    for (const [key, originItem] of originMap.entries()) {
      if (!newDataMap.has(key)) {
        await tx.source.updateMany({
          where: { character_id: characterId, id: originItem.id },
          data: { deleted_at: createdAt },
        });
      }
    }
  }

  /**
   * 캐릭터에 저장된 소스들을 전체 반환한다.
   * @param characterId
   */
  async getAll(characterId: string): Promise<Source.GetAllResponse> {
    const data = await this.prisma.source.findMany({
      select: {
        id: true,
        type: true,
        subtype: true,
        url: true,
        created_at: true,
      },

      where: { character_id: characterId, deleted_at: null },
    });

    /**
     * mapping
     */
    const sources = data.map((el): Source.GetResponse => this.mapping(el));

    return { characterId, sources };
  }

  /**
   * 프리즈마 객체를 인터페이스 타입으로 매핑한다.
   * @param input source 프리즈마 내부 타입 그대로의 객체이다.
   */
  private mapping(source: {
    id: string;
    type: string;
    subtype: string;
    url: string;
    created_at: Date;
  }): Source.GetResponse {
    return {
      id: source.id,
      type: source.type as Source['type'],
      subtype: source.subtype,
      url: source.url,
      createdAt: source.created_at.toISOString(),
    };
  }
}
