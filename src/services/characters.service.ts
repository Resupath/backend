import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { PositionsService } from './positions.service';
import { PrismaService } from './prisma.service';
import { SkillsService } from './skills.service';

@Injectable()
export class CharactersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly positionsService: PositionsService,
    private readonly skillsService: SkillsService,
  ) {}

  async create(memberId: string, input: Character.CreateRequest) {
    const characterId = randomUUID();
    const snapshotId = randomUUID();
    const date = DateTimeUtil.now();

    // 0. 직군(Position), 스킬(Skill) 생성
    const positions = await this.positionsService.findOrCreateMany(
      input.positions,
    );
    const skills = await this.skillsService.findOrCreateMany(input.skills);

    // 1. 캐릭터 생성
    const character = await this.prisma.character.create({
      select: {
        id: true,
      },
      data: {
        id: characterId,
        member_id: memberId,
        is_public: input.isPublic,
        created_at: date,
        snapshots: {
          create: {
            id: snapshotId,
            nickname: input.nickname,
            image: input.image,
            created_at: date,
            /**
             * snapshot relations
             */
            character_snapshot_experiences: {
              createMany: {
                data: input.experiences.map(
                  (
                    experince,
                  ): Prisma.Character_Snapshot_ExperienceCreateManyCharacter_snapshotInput => {
                    return {
                      experience_id: experince.id,
                      created_at: date,
                    };
                  },
                ),
              },
            },
            character_snapshot_positions: {
              createMany: {
                data: positions.map(
                  (
                    positionId,
                  ): Prisma.Character_Snapshot_PositionCreateManyCharacter_snapshotInput => {
                    return {
                      position_id: positionId,
                    };
                  },
                ),
              },
            },
            character_snapshot_skills: {
              createMany: {
                data: skills.map(
                  (
                    skillId,
                  ): Prisma.Character_Snapshot_SkillCreateManyCharacter_snapshotInput => {
                    return { skill_id: skillId };
                  },
                ),
              },
            },
          },
        },
        last_snapshot: {
          create: {
            character_snapshot_id: snapshotId,
          },
        },
      },
    });

    // 2. 캐릭터 ㅡ 성격 관계 지정
    await this.createCharacterPersonalities(
      characterId,
      input.personalities,
      date,
    );

    return character;
  }

  async get(id: string): Promise<Character.GetResponse> {
    const character = await this.prisma.character.findUnique({
      select: {
        id: true,
        member_id: true,
        is_public: true,
        last_snapshot: {
          select: {
            snapshot: {
              select: {
                nickname: true,
                image: true,
                created_at: true,
              },
            },
          },
        },
        character_personalites: {
          select: {
            personality: {
              select: { keyword: true },
            },
          },
        },
      },
      where: { id, is_public: true },
    });

    const snapshot = character?.last_snapshot?.snapshot;

    if (!snapshot) {
      throw new NotFoundException();
    }

    /**
     * mapping
     */
    return {
      id: character.id,
      memberId: character.member_id,
      isPublic: character.is_public,

      nickname: snapshot.nickname,
      image: snapshot.image,
      createdAt: snapshot.created_at.toISOString(),

      personalities: character.character_personalites.map(
        (el) => el.personality.keyword,
      ),
    };
  }

  async getBypage(
    query: Character.GetByPageRequest,
  ): Promise<Character.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const whereInput: Prisma.CharacterWhereInput = { is_public: true };

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
        where: whereInput,
        skip,
        take,
      }),
      this.prisma.character.count({ where: whereInput }),
    ]);

    /**
     * mapping
     */
    const data = characters.map((el): Character.GetByPageData => {
      if (!el?.last_snapshot?.snapshot) {
        throw new NotFoundException();
      }
      return {
        id: el.id,
        nickname: el.last_snapshot.snapshot.nickname,
        createdAt: el.last_snapshot.snapshot.created_at.toISOString(),
      };
    });

    return PaginationUtil.createResponse({
      data,
      count,
      skip,
      take,
    });
  }

  private async createCharacterPersonalities(
    characterId: string,
    personalities: Character.CreateRequest['personalities'],
    date: string,
  ) {
    const characterPersonalities = personalities.map(
      (personality): Prisma.Character_PersonalityCreateManyInput => ({
        character_id: characterId,
        personality_id: personality.id,
        created_at: date,
      }),
    );

    await this.prisma.character_Personality.createMany({
      data: characterPersonalities,
    });
  }
}
