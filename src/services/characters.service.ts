import { Injectable } from '@nestjs/common';
import { Character } from 'src/interfaces/characters.interface';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from './prisma.service';

@Injectable()
export class CharactersService {
  constructor(private readonly prisma: PrismaService) {}

  async create(memberId: string, input: Character.CreateCharacterRequest) {
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
}
