import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Room } from 'src/interfaces/rooms.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

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

  async getAll(userId: string): Promise<Array<Room.GetResponse>> {
    const userIds = await this.authService.findUserIds(userId);

    const rooms = await this.prisma.room.findMany({
      select: {
        id: true,
        created_at: true,
        user: { select: { id: true } },
        character: {
          select: {
            id: true,
            created_at: true,
            last_snapshot: { select: { snapshot: { select: { nickname: true, image: true } } } },
          },
        },
      },
      where: {
        deleted_at: null,
        user_id: { in: userIds },
      },
    });

    /**
     * mapping
     */
    return rooms.map((el) => {
      if (!el || !el.character.last_snapshot) {
        throw new NotFoundException();
      }

      return {
        id: el.id,
        createdAt: el.created_at.toISOString(),
        user: {
          id: el.user.id,
        },
        character: {
          id: el.character.id,
          createdAt: el.character.created_at.toISOString(),
          nickname: el.character.last_snapshot.snapshot.nickname,
          image: el.character.last_snapshot.snapshot.image,
        },
      };
    });
  }

  async get(userId: string, id: string): Promise<Room.GetResponse> {
    const userIds = await this.authService.findUserIds(userId);

    const room = await this.prisma.room.findUnique({
      select: {
        id: true,
        created_at: true,
        user: { select: { id: true } },
        character: {
          select: {
            id: true,
            created_at: true,
            last_snapshot: { select: { snapshot: { select: { nickname: true, image: true } } } },
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
        image: room.character.last_snapshot.snapshot.image,
      },
    };
  }
}
