import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character, CharacterSnapshot } from 'src/interfaces/characters.interface';
import { Member } from 'src/interfaces/member.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { ExperiencesService } from './experiences.service';
import { PersonalitiesService } from './personalities.service';
import { PositionsService } from './positions.service';
import { PrismaService } from './prisma.service';
import { SkillsService } from './skills.service';
import { SourcesService } from './sources.service';

@Injectable()
export class CharactersService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly personalitiesService: PersonalitiesService,
    private readonly experiencesService: ExperiencesService,
    private readonly positionsService: PositionsService,
    private readonly skillsService: SkillsService,
    private readonly sourcesService: SourcesService,
  ) {}

  /**
   * 캐릭터를 생성한다.
   */
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
                data: positions.map((position) => {
                  return {
                    position_id: position.id,
                  };
                }),
              },
            },
            character_snapshot_skills: {
              createMany: {
                data: skills.map((skill) => {
                  return { skill_id: skill.id };
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

  /**
   * 특정 캐릭터를 상세조회한다.
   *
   * @param id 조회할 캐릭터의 아이디
   * @param option 조회 옵셔널 파라미터들이다.
   * -  isPublic: 공개 캐릭터만 조회하고 싶을 경우 true로 설정한다.
   */
  async get(
    id: string,
    option?: {
      isPublic?: true;
    },
  ): Promise<Character.GetResponse> {
    const whereInput: Prisma.CharacterWhereUniqueInput = { id: id, is_public: option?.isPublic ? true : undefined };

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
        sources: {
          select: { id: true, type: true, subtype: true, url: true, created_at: true },
          where: { deleted_at: null },
        },
        character_personalites: {
          select: {
            personality: {
              select: { id: true, keyword: true },
            },
          },
        },
        _count: { select: { rooms: true } },
      },
      where: whereInput,
    });

    const snapshot = character?.last_snapshot?.snapshot;

    if (!snapshot) {
      throw new NotFoundException('캐릭터 조회 실패. 삭제되었거나 비공개 된 캐릭터 입니다.');
    }

    /**
     * mapping experinece
     */
    const experiences = snapshot.character_snapshot_experiences.map((el) =>
      this.experiencesService.mapping(el.experience),
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
      nickname: snapshot.nickname,
      image: snapshot.image,

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

  /**
   * 캐릭터를 페이지네이션 조회한다.
   *
   * @param query 페이지네이션 요청 쿼리 객체.
   * @param option 조회시 where 조건에 사용되는 옵셔널 파라미터의 객체이다.
   *    - isPublic : 공개 여부이다. 공개된 캐릭터만 조회할 경우 true로 설정해야 한다,
   *    - memberId : 특정 멤버의 캐릭터만 조회하고 싶다면, 이 파라미터에 아이디를 넣어주어야 한다.
   *    - deletedAt : 삭제 여부이다. 삭제된 캐릭터도 조회하고 싶다면 true로 설정한다.
   */
  async getBypage(
    query: Character.GetByPageRequest,
    option: {
      isPublic?: true;
      memberId?: Member['id'];
      deletedAt?: true;
    },
  ): Promise<Character.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    // 검색 조건
    const getWhereInput = (): Prisma.CharacterWhereInput => {
      return {
        is_public: option.isPublic,
        member_id: option.memberId,
        deleted_at: option.deletedAt ? undefined : null,
        ...(query.search
          ? {
              OR: [
                {
                  last_snapshot: {
                    snapshot: {
                      nickname: {
                        contains: query.search,
                        mode: 'insensitive', // 대소문자 구분 없이 검색
                      },
                    },
                  },
                },
                {
                  last_snapshot: {
                    snapshot: {
                      character_snapshot_positions: {
                        some: {
                          postion: {
                            keyword: {
                              contains: query.search,
                              mode: 'insensitive',
                            },
                          },
                        },
                      },
                    },
                  },
                },
                {
                  last_snapshot: {
                    snapshot: {
                      character_snapshot_skills: {
                        some: {
                          skill: {
                            keyword: {
                              contains: query.search,
                              mode: 'insensitive',
                            },
                          },
                        },
                      },
                    },
                  },
                },
              ],
            }
          : {}),
      };
    };

    const whereInput: Prisma.CharacterWhereInput = getWhereInput();

    const orderInput: Prisma.CharacterOrderByWithRelationInput =
      query.sort === 'roomCount' // 누적 대화순
        ? {
            rooms: {
              _count: 'desc',
            },
          }
        : { created_at: 'desc' }; // 최신순

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
        orderBy: orderInput,
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
        throw new NotFoundException(
          `캐릭터 목록 조회 실패. 캐릭터 스냅샷 데이터가 존재하지않습니다. characterId: ${el.id}`,
        );
      }

      const experiences = snapshot.character_snapshot_experiences.map((el) =>
        this.experiencesService.mapping(el.experience),
      );
      const experienceYears = this.experiencesService.getExperienceYears(experiences);

      return {
        id: el.id,
        memberId: el.member_id,
        isPublic: el.is_public,
        createdAt: el.created_at.toISOString(),
        nickname: snapshot.nickname,
        image: snapshot.image,

        personalities: el.character_personalites.map((el) => {
          return { id: el.personality.id, keyword: el.personality.keyword };
        }),

        /**
         * snapshot relation
         */
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

  /**
   * 캐릭터를 수정한다.
   */
  async update(memberId: Member['id'], id: Character['id'], newData: Character.UpdateRequest): Promise<void> {
    const origin = await this.get(id);
    const date = DateTimeUtil.now();

    if (origin.memberId !== memberId) {
      throw new ForbiddenException(
        '캐릭터 수정 실패. 캐릭터 수정 권한이 없습니다. 본인의 캐릭터만 수정할 수 있습니다.',
      );
    }

    // 직군(Position), 스킬(Skill) 생성
    const positions = await this.positionsService.findOrCreateMany(newData.positions);
    const skills = await this.skillsService.findOrCreateMany(newData.skills);
    const sources = await this.sourcesService.findOrCreateMany(id, newData.sources);

    await this.prisma.$transaction(async (tx) => {
      /**
       * 0. 캐릭터 공개 여부 수정
       */
      if (origin.isPublic !== newData.isPublic) {
        await tx.character.update({ data: { is_public: newData.isPublic }, where: { id: id } });
      }

      /**
       * 1. 성격-캐릭터 관계를 업데이트 한다.
       */
      await this.personalitiesService.updateAndDeleteMany(tx, id, origin.personalities, newData.personalities, date);

      /**
       * 2. 첨부파일-캐릭터 관계를 업데이트 한다.
       */
      await this.sourcesService.deleteMany(tx, id, origin.sources, sources, date);

      /**
       * 3. 캐릭터 스냅샷을 업데이트한다.
       * 변경점이 없다면 마지막 스냅샷 정보를 가져온다.
       */
      const isSnapshotChaged = origin.nickname !== newData.nickname || origin.image !== newData.image;

      const snapshot = isSnapshotChaged
        ? await this.createNewSnapshot(tx, {
            characterId: id,
            nickname: newData.nickname,
            image: newData.image,
            createdAt: date,
          })
        : await this.getLastSnapshot(id, tx);

      /**
       * 4. 경력-캐릭터 스냅샷 관계를 업데이트한다.
       */
      await this.experiencesService.updateAndDeleteMany(tx, snapshot.id, origin.experiences, newData.experiences, date);

      /**
       * 5. 직종-캐릭터 스냅샷 관계를 업데이트한다.
       */
      await this.positionsService.updateAndDeleteMany(tx, snapshot.id, origin.positions, positions);

      /**
       * 6. 기술스택-캐릭터 스냅샷 관계를 업데이트한다.
       */
      await this.skillsService.updateAndDeleteMany(tx, snapshot.id, origin.skills, skills);
    });
  }

  /**
   * 캐릭터의 마지막 스냅샷을 조회한다.
   * @param characterId
   */
  private async getLastSnapshot(
    characterId: Character['id'],
    tx?: Prisma.TransactionClient,
  ): Promise<CharacterSnapshot.GetResponse> {
    const lastSnapshot = await (tx ?? this.prisma).character.findUnique({
      select: {
        last_snapshot: {
          select: {
            snapshot: {
              select: {
                id: true,
                nickname: true,
                image: true,
                created_at: true,
              },
            },
          },
        },
      },
      where: {
        id: characterId,
      },
    });

    const snapshot = lastSnapshot?.last_snapshot?.snapshot;

    if (!snapshot) {
      throw new NotFoundException('캐릭터 마지막 스냅샷 조회 실패. 스냅샷 데이터가 존재하지 않습니다.');
    }

    return {
      id: snapshot.id,
      nickname: snapshot.nickname,
      image: snapshot.image,
      createdAt: snapshot.created_at.toDateString(),
    };
  }

  /**
   * 캐릭터 스냅샷 정보를 수정한다.
   * 새로운 스냅샷을 생성하고 마지막 스냅샷을 생성한 스냅샷으로 업데이트 한다.
   */
  private async createNewSnapshot(
    tx: Prisma.TransactionClient,
    input: CharacterSnapshot.CreateRequest,
  ): Promise<CharacterSnapshot.GetResponse> {
    const snapshotId = randomUUID();
    const newSnapshot = await tx.character_Snapshot.create({
      select: { id: true, nickname: true, image: true, created_at: true },
      data: {
        id: snapshotId,
        nickname: input.nickname,
        image: input.image,
        created_at: input.createdAt,
        character_id: input.characterId,
      },
    });

    const lastSnapshot = await tx.character_Last_Snapshot.update({
      data: { character_snapshot_id: snapshotId },
      where: { character_id: input.characterId },
    });

    return {
      id: newSnapshot.id,
      nickname: newSnapshot.nickname,
      image: newSnapshot.image,
      createdAt: newSnapshot.created_at.toISOString(),
    };
  }
}
