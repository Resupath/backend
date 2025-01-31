import { Injectable, NotFoundException } from '@nestjs/common';
import { Member, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { ExperiencesService } from './experiences.service';
import { PositionsService } from './positions.service';
import { PrismaService } from './prisma.service';
import { SkillsService } from './skills.service';

@Injectable()
export class CharactersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly experiencesService: ExperiencesService,
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
        sources: {
          createMany: {
            data: input.sources.map((source) => {
              return {
                id: randomUUID(),
                type: source.type,
                subtype: source.subtype,
                url: source.url,
                created_at: date,
              };
            }),
          },
        },
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
                data: input.experiences.map((experince) => {
                  return {
                    experience_id: experince.id,
                    created_at: date,
                  };
                }),
              },
            },
            character_snapshot_positions: {
              createMany: {
                data: positions.map((positionId) => {
                  return {
                    position_id: positionId,
                  };
                }),
              },
            },
            character_snapshot_skills: {
              createMany: {
                data: skills.map((skillId) => {
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
                character_snapshot_positions: {
                  select: {
                    postion: {
                      select: { id: true, keyword: true },
                    },
                  },
                },
                character_snapshot_skills: {
                  select: {
                    skill: {
                      select: { id: true, keyword: true },
                    },
                  },
                },
                character_snapshot_experiences: {
                  select: {
                    experience: {
                      select: this.experiencesService.createSelectInput(),
                    },
                  },
                },
              },
            },
          },
        },
        sources: { select: { id: true, type: true, subtype: true, url: true, created_at: true } },
        character_personalites: {
          select: {
            personality: {
              select: { id: true, keyword: true },
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

    /**
     * mapping experinece
     */
    const experiences = snapshot.character_snapshot_experiences.map((el) =>
      this.experiencesService.mappingOutput(el.experience),
    );

    const experienceYears = this.experiencesService.getExperienceYears(experiences);

    /**
     * mapping
     */
    return {
      id: character.id,
      memberId: character.member_id,
      isPublic: character.is_public,
      createdAt: character.created_at.toISOString(),
      personalities: character.character_personalites.map((el) => {
        return { id: el.personality.id, keyword: el.personality.keyword };
      }),
      sources: character.sources.map((el) => {
        return {
          id: el.id,
          type: el.type as 'link' | 'file',
          subtype: el.subtype,
          url: el.url,
          createdAt: el.created_at.toISOString(),
        };
      }),

      /**
       * snapshot relation
       */
      nickname: snapshot.nickname,
      image: snapshot.image,
      positions: snapshot.character_snapshot_positions.map((el) => {
        return {
          id: el.postion.id,
          keyword: el.postion.keyword,
        };
      }),
      skills: snapshot.character_snapshot_skills.map((el) => {
        return {
          id: el.skill.id,
          keyword: el.skill.keyword,
        };
      }),
      experiences: experiences,

      /**
       * aggregation
       */
      experienceYears: experienceYears,
      roomCount: character._count.rooms,
    };
  }

  async getBypage(
    query: Character.GetByPageRequest,
    option: {
      isPublic?: boolean;
      memberId?: Member['id'];
    },
  ): Promise<Character.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);
    const whereInput: Prisma.CharacterWhereInput = { is_public: option.isPublic, member_id: option.memberId };

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
                  character_snapshot_positions: {
                    select: {
                      postion: {
                        select: {
                          id: true,
                          keyword: true,
                        },
                      },
                    },
                  },
                  character_snapshot_skills: {
                    select: {
                      skill: {
                        select: { id: true, keyword: true },
                      },
                    },
                  },
                  character_snapshot_experiences: {
                    select: {
                      experience: {
                        select: this.experiencesService.createSelectInput(),
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
                select: { id: true, keyword: true },
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
    const data = characters.map((el): Character.GetBypageData => {
      const snapshot = el?.last_snapshot?.snapshot;

      if (!snapshot) {
        throw new NotFoundException();
      }

      const experiences = snapshot.character_snapshot_experiences.map((el) =>
        this.experiencesService.mappingOutput(el.experience),
      );
      const experienceYears = this.experiencesService.getExperienceYears(experiences);

      return {
        id: el.id,
        memberId: el.member_id,
        isPublic: el.is_public,
        createdAt: el.created_at.toISOString(),
        personalities: el.character_personalites.map((el) => {
          return { id: el.personality.id, keyword: el.personality.keyword };
        }),

        /**
         * snapshot relation
         */
        nickname: snapshot.nickname,
        image: snapshot.image,
        positions: snapshot.character_snapshot_positions.map((el) => {
          return {
            id: el.postion.id,
            keyword: el.postion.keyword,
          };
        }),
        skills: snapshot.character_snapshot_skills.map((el) => {
          return {
            id: el.skill.id,
            keyword: el.skill.keyword,
          };
        }),

        /**
         * aggregation
         */
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
}
