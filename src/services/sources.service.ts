import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Source } from 'src/interfaces/source.interface';
import { DateTimeUtil } from 'src/util/datetime.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(characterId: Source['characterId'], body: Source.CreateRequest): Promise<Source.CreateResponse> {
    const date = DateTimeUtil.now();

    const source = await this.prisma.source.create({
      select: { id: true },
      data: {
        id: randomUUID(),
        character_id: characterId,
        type: body.type,
        subtype: body.subtype,
        url: body.url,
        created_at: date,
      },
    });

    return source;
  }

  async createMany(characterId: string, body: Array<Source.CreateRequest>): Promise<{ count: number }> {
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

    const count = await this.prisma.source.createMany({
      data: createInput,
    });

    return count;
  }

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
    const sources = data.map((el): Source.GetResponse => {
      return {
        id: el.id,
        type: el.type as Source['type'],
        subtype: el.subtype,
        url: el.url,
        createdAt: el.created_at.toISOString(),
      };
    });

    return { characterId, sources };
  }
}
