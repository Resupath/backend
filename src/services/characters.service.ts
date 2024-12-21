import { Injectable, NotFoundException } from '@nestjs/common';
import { Character } from 'src/interfaces/characters.interface';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from './prisma.service';
import { PaginationUtil } from 'src/util/pagination.util';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(memberId: string, input: Character.CreateRequest) {
    const characterId = uuidv4();
    const snapshotId = uuidv4();
    const date = new Date().toISOString();

    const character = await this.prisma.character.create({
      select: {
        id: true,
      },
      data: {
        id: characterId,
        member_id: memberId,
        created_at: date,
        snapshots: {
          create: {
            id: snapshotId,
            nickname: input.nickname,
            is_public: input.isPublic,
            created_at: date,
          },
        },
        last_snapshot: {
          create: {
            character_snapshot_id: snapshotId,
          },
        },
      },
    });

    return character;
  }

  async get(id: string): Promise<Character.GetResponse> {
    const character = await this.prisma.character.findUnique({
      select: {
        id: true,
        member_id: true,
        last_snapshot: {
          select: {
            snapshot: {
              select: {
                nickname: true,
                is_public: true,
                created_at: true,
              },
            },
          },
        },
      },
      where: { id, last_snapshot: { snapshot: { is_public: true } } },
    });

    if (!character?.last_snapshot?.snapshot) {
      throw new NotFoundException();
    }

    return {
      id: character.id,
      memberId: character.member_id,
      nickname: character.last_snapshot.snapshot.nickname,
      isPublic: character.last_snapshot.snapshot.is_public,
      createAt: character.last_snapshot.snapshot.created_at,
    };
  }

  async getBypage(
    query: Character.GetByPageRequest,
  ): Promise<Character.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const [characters, count] = await this.prisma.$transaction([
      this.prisma.character.findMany({
        select: {
          id: true,
          member_id: true,
          last_snapshot: {
            select: {
              snapshot: {
                select: {
                  nickname: true,
                  created_at: true,
                },
              },
            },
          },
        },
        skip,
        take,
      }),
      this.prisma.character.count(),
    ]);

    const data = characters.map((el) => {
      if (!el?.last_snapshot?.snapshot) {
        throw new NotFoundException();
      }
      return {
        id: el.id,
        nickname: el.last_snapshot.snapshot.nickname,
        createAt: el.last_snapshot.snapshot.created_at,
      };
    });

    return PaginationUtil.createPaginationResponse({
      data,
      count,
      skip,
      take,
    });
  }
}
