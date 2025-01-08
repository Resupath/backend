import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Room } from 'src/interfaces/rooms.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PrismaService } from './prisma.service';
import { User } from 'src/interfaces/user.interface';

@Injectable()
export class RoomsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(userId: string, body: Room.CreateRequest): Promise<Room.CreateResponse> {
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

  async get(userId: string, id: string): Promise<Room.GetResponse> {
    const userIds = await this.getUserIds(userId);

    const room = await this.prisma.room.findUnique({
      select: {
        id: true,
        created_at: true,
        user: { select: { id: true } },
        character: {
          select: {
            id: true,
            created_at: true,
            last_snapshot: { select: { snapshot: { select: { nickname: true } } } },
          },
        },
      },
      where: {
        id,
        deleted_at: null,
        user_id: { in: userIds },
      },
    });

    if (!room || !room.character.last_snapshot) {
      throw new NotFoundException();
    }

    return {
      id: room.id,
      createdAt: room.created_at.toISOString(),
      user: {
        id: room.user.id,
      },
      character: {
        id: room.character.id,
        createdAt: room.character.created_at.toISOString(),
        nickname: room.character.last_snapshot.snapshot.nickname,
      },
    };
  }

  private async getUserIds(userId: User['id']): Promise<Array<User['id']>> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
      },
      where: {
        OR: [{ id: userId }, { member: { users: { some: { id: userId } } } }],
      },
    });

    return users.map((user) => user.id);
  }
}
