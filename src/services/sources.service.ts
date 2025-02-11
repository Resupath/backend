import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Source } from 'src/interfaces/source.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
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
   * 캐릭터에 저장된 특정 소스를 조회한다.
   */
  async get(characterId: Source['characterId'], id: Source['id']): Promise<Source.GetResponse> {
    const source = await this.prisma.source.findUnique({
      select: {
        id: true,
        type: true,
        subtype: true,
        url: true,
        created_at: true,
      },

      where: { id, character_id: characterId, deleted_at: null },
    });

    if (!source) {
      throw new NotFoundException('존재하지 않는 소스 입니다.');
    }

    return this.mapping(source);
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
