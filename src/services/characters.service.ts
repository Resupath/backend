import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Experience } from 'src/interfaces/experiences.interface';
import { DateTimeUtil } from 'src/util/datetime.util';
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
    const positions = await this.positionsService.findOrCreateMany(input.positions);
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
                  (experince): Prisma.Character_Snapshot_ExperienceCreateManyCharacter_snapshotInput => {
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
                  (positionId): Prisma.Character_Snapshot_PositionCreateManyCharacter_snapshotInput => {
                    return {
                      position_id: positionId,
                    };
                  },
                ),
              },
            },
            character_snapshot_skills: {
              createMany: {
                data: skills.map((skillId): Prisma.Character_Snapshot_SkillCreateManyCharacter_snapshotInput => {
                  return { skill_id: skillId };
                }),
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
    await this.createCharacterPersonalities(characterId, input.personalities, date);

    return character;
  }

  async get(id: string): Promise<Character.GetResponse> {
    const character = await this.prisma.character.findUnique({
      select: {
        id: true,
        member_id: true,
        is_public: true,
        created_at: true,
        last_snapshot: {
          select: {
            snapshot: {
              select: {
                nickname: true,
                image: true,
                character_snapshot_experiences: {
                  select: {
                    experience: {
                      select: { start_date: true, end_date: true },
                    },
                  },
                },
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
        _count: { select: { rooms: true } },
      },
      where: { id, is_public: true },
    });

    const snapshot = character?.last_snapshot?.snapshot;

    if (!snapshot) {
      throw new NotFoundException();
    }

    const experienceYears = this.getExperienceYears(snapshot.character_snapshot_experiences);

    /**
     * mapping
     */
    return {
      id: character.id,
      memberId: character.member_id,
      isPublic: character.is_public,
      createdAt: character.created_at.toISOString(),

      nickname: snapshot.nickname,
      image: snapshot.image,

      personalities: character.character_personalites.map((el) => el.personality.keyword),
      experienceYears: experienceYears,
      roomCount: character._count.rooms,
    };
  }

  async getBypage(query: Character.GetByPageRequest): Promise<Character.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const whereInput: Prisma.CharacterWhereInput = { is_public: true };

    const [characters, count] = await this.prisma.$transaction([
      this.prisma.character.findMany({
        select: {
          id: true,
          member_id: true,
          is_public: true,
          created_at: true,
          last_snapshot: {
            select: {
              snapshot: {
                select: {
                  nickname: true,
                  image: true,
                  character_snapshot_experiences: {
                    select: {
                      experience: {
                        select: { start_date: true, end_date: true },
                      },
                    },
                  },
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
          _count: {
            select: { rooms: true },
          },
        },
        orderBy: {
          rooms: {
            _count: 'desc',
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
    const data = characters.map((el): Character.GetResponse => {
      const snapshot = el?.last_snapshot?.snapshot;

      if (!snapshot) {
        throw new NotFoundException();
      }
      const experienceYears = this.getExperienceYears(snapshot.character_snapshot_experiences);

      return {
        id: el.id,
        memberId: el.member_id,
        isPublic: el.is_public,
        createdAt: el.created_at.toISOString(),

        nickname: snapshot.nickname,
        image: snapshot.image,

        personalities: el.character_personalites.map((el) => el.personality.keyword),
        experienceYears: experienceYears,
        roomCount: el._count.rooms,
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

  /**
   * 경력들의 시작 날짜와 종료날짜를 받아 연차를 계산한다.
   */
  private getExperienceYears(
    input: Array<{
      experience: {
        start_date: Experience['startDate'];
        end_date: Experience['endDate'];
      };
    }>,
  ): number {
    const totalMonths = input.reduce((acc, el) => {
      return acc + DateTimeUtil.BetweenMonths(el.experience.start_date, el.experience.end_date);
    }, 0);

    const totalYears = Math.floor(totalMonths / 12) + 1;

    return totalYears;
  }
}
