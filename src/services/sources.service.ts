import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
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
      throw new NotFoundException('존재하지 않는 소스 입니다.');
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
  ) {
    const source = await this.get(characterId, id, { memberId: memberId });
    const isChanged = ObjectUtil.isChanged(source, body);

    if (!isChanged) {
      return { message: '변경된 내용이 없습니다.' };
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
