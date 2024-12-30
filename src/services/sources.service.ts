import { Injectable } from '@nestjs/common';
import { Source } from 'src/interfaces/source.interface';
import { PrismaService } from './prisma.service';
import { randomUUID } from 'crypto';
import { DateTimeUtil } from 'src/util/dateTime.util';

@Injectable()
export class SourcesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    characterId: Source['characterId'],
    body: Source.CreateRequest,
  ): Promise<Source.CreateResponse> {
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
}
