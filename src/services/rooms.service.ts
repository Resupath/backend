import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Room } from 'src/interfaces/rooms.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    userId: string,
    body: Room.CreateRequest,
  ): Promise<Room.CreateResponse> {
    const date = DateTimeUtil.now();

    const room = await this.prisma.room.create({
      select: { id: true },
      data: {
        id: randomUUID(),
        user_id: userId,
        character_id: body.characterId,
        created_at: date,
      },
    });

    return room;
  }
}
