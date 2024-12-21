import { Injectable, NotFoundException } from '@nestjs/common';
import { Character } from 'src/interfaces/characters.interface';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from './prisma.service';

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
                id: true,
                nickname: true,
                is_public: true,
                created_at: true,
              },
            },
          },
        },
      },
      where: { id },
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
}
