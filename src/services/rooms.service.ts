import { Prisma } from '.prisma/client';
import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Room } from 'src/interfaces/rooms.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { User } from 'src/interfaces/user.interface';
import { CharactersService } from './characters.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  /**
   * 채팅방을 생성한다.
   */
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

  /**
   * user의 채팅방 전체 목록을 가져온다.
   */
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
      orderBy: { created_at: 'desc' },
    });

    /**
     * mapping
     */
    return rooms.map((el) => {
      if (!el || !el.character.last_snapshot) {
        throw new NotFoundException(`채팅방 전체 조회 실패.`);
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

  /**
   * 채팅방을 페이지네이션으로 조회한다.
   *
   * @param query 페이지네이션 요청 객체.
   *
   * @param option 조회 옵셔널 파라미터.
   * - characterId: 특정캐릭터의 데이터만을 조회하고 싶다면 id를 입력한다.
   * - deletedAt: 삭제된 데이터를 포함해서 보고 싶다면 true로 설정한다.
   */
  async getByPage(
    query: Room.GetByPageRequest,
    option: { characterId?: Character['id']; deletedAt?: true },
  ): Promise<Room.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const whereInput: Prisma.RoomWhereInput = {
      deleted_at: option.deletedAt ? undefined : null,
    };

    const [rooms, count] = await this.prisma.$transaction([
      this.prisma.room.findMany({
        select: { id: true, user_id: true, character_id: true, created_at: true },
        where: whereInput,
        orderBy: { created_at: 'desc' },
        skip,
        take,
      }),

      this.prisma.room.count({ where: whereInput }),
    ]);

    /**
     * mapping
     */
    const data = rooms.map((el): Room.GetByPageData => {
      return { id: el.id, userId: el.user_id, characterId: el.character_id, createdAt: el.created_at.toISOString() };
    });

    return PaginationUtil.createResponse({
      data,
      count,
      skip,
      take,
    });
  }

  /**
   * 채팅방을 상세 조회한다. 어떠한 캐릭터와 유저가 채팅방에 속해있는지 확인한다.
   */
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
      throw new NotFoundException('채팅방 상세 조회 실패. 이미 삭제된 방이거나 데이터가 존재하지 않습니다.');
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

  /**
   * 채팅방을 삭제한다.
   */
  async delete(userId: User['id'], id: Room['id']): Promise<void> {
    const userIds = await this.authService.findUserIds(userId);

    const room = await this.prisma.room.findUnique({
      select: {
        user_id: true,
      },
      where: { id },
    });

    if (!room || !userIds.includes(room.user_id)) {
      throw new NotFoundException('채팅방 삭제 실패. 이미 삭제된 채팅방이거나 권한이 없습니다.');
    }

    const date = DateTimeUtil.now();

    await this.prisma.room.update({
      data: { deleted_at: date },
      where: { id: id },
    });
  }
}
