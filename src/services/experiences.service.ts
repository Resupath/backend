import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Experience } from 'src/interfaces/experiences.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { ObjectUtil } from 'src/util/object.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * experience에 대한 프리즈마 select where input을 반환한다.
   * 반복되는 스냅샷 select 문을 대체 할때 사용.
   */
  createSelectInput() {
    return {
      id: true,
      created_at: true,
      last_snapshot: {
        select: {
          snapshot: {
            select: {
              company_name: true,
              position: true,
              description: true,
              start_date: true,
              end_date: true,
              sequence: true,
            },
          },
        },
      },
    } as const;
  }

  /**
   * createSelectInput()의 select 결과물을 Experience.GetResponse으로 매핑한다.
   */
  mapping(experience: {
    id: string;
    created_at: Date;
    last_snapshot: {
      snapshot: {
        position: string;
        company_name: string;
        start_date: string;
        end_date: string | null;
        description: string | null;
        sequence: number;
      };
    } | null;
  }): Experience.GetResponse {
    const snapshot = experience.last_snapshot?.snapshot;

    if (!snapshot) {
      throw new NotFoundException(`경력 인터페이스 매핑 실패 \n경력 스냅샷을 찾을 수 없습니다. id: ${experience.id}`);
    }

    return {
      id: experience.id,
      createdAt: experience.created_at.toISOString(),
      companyName: snapshot.company_name,
      position: snapshot.position,
      description: snapshot.description,
      startDate: snapshot.start_date,
      endDate: snapshot.end_date,
      sequence: snapshot.sequence,
    };
  }

  /**
   * 멤버의 경력 정보를 여러개 생성합니다. (트랜잭션 사용)
   */
  async createMany(memberId: string, body: Experience.CreateManyRequest): Promise<Array<Experience.GetResponse>> {
    const { experiences } = body;
    const date = DateTimeUtil.now();

    const newExperiences = await this.prisma.$transaction(async (tx) => {
      return await Promise.all(
        experiences.map((el) => {
          const id = randomUUID();
          const snapshotId = randomUUID();

          return tx.experience.create({
            select: this.createSelectInput(),
            data: {
              id: id,
              member_id: memberId,
              created_at: date,
              last_snapshot: {
                create: {
                  snapshot: {
                    create: {
                      id: snapshotId,
                      experience_id: id,
                      company_name: el.companyName,
                      position: el.position,
                      description: el.description,
                      start_date: el.startDate,
                      end_date: el.endDate,
                      sequence: el.sequence,
                      created_at: date,
                    },
                  },
                },
              },
            },
          });
        }),
      );
    });

    return newExperiences.map((el) => this.mapping(el));
  }

  /**
   * 특정 경력을 사용하고 있는 캐릭터를 전체 반환한다.
   * 경력을 반환하는게 아니라 캐릭터 리스트를 반환합니다.
   *
   * @param id 조회할 경력의 아이디 입니다.
   */
  async getCharacters(id: Experience['id']): Promise<Array<Omit<Character, 'deletedAt' | 'memberId'>>> {
    const characters = await this.prisma.character.findMany({
      select: {
        id: true,
        is_public: true,
        created_at: true,
        last_snapshot: {
          select: {
            snapshot: {
              select: {
                nickname: true,
                email: true,
                phone: true,
                image: true,
              },
            },
          },
        },
      },
      where: {
        last_snapshot: {
          snapshot: {
            character_snapshot_experiences: {
              some: {
                experience_id: id,
                deleted_at: null,
              },
            },
          },
        },
      },
    });

    /**
     * mapping
     */
    return characters.map((el) => {
      const snapshot = el.last_snapshot?.snapshot;

      if (!snapshot) {
        throw new NotFoundException(`캐릭터 스냅샷이 존재하지 않습니다. id: ${el.id}`);
      }

      return {
        id: el.id,
        nickname: snapshot.nickname,
        email: snapshot.email,
        phone: snapshot.phone,
        image: snapshot.image,
        isPublic: el.is_public,
        createdAt: el.created_at.toISOString(),
      };
    });
  }

  /**
   * 멤버가 저장한 경력들을 전체 조회한다. 삭제한 경력은 조회되지 않는다.
   *
   * @param memberId 조회할 멤버의 아이디.
   */
  async getAll(memberId: string): Promise<Array<Experience.GetResponse>> {
    const experiences = await this.prisma.experience.findMany({
      select: this.createSelectInput(),
      where: { member_id: memberId, deleted_at: null },
      orderBy: { last_snapshot: { snapshot: { sequence: 'asc' } } },
    });

    return experiences.map((el) => this.mapping(el));
  }

  /**
   * 캐릭터의 마지막 스냅샷에 저장된 경력들을 전체 조회합니다.
   *
   * @param characterId 조회한 캐릭터의 아이디
   */
  async getAllByCharacterId(characterId: string): Promise<Array<Experience.GetResponse>> {
    const character = await this.prisma.character.findUnique({
      select: {
        last_snapshot: {
          select: {
            snapshot: {
              select: {
                character_snapshot_experiences: {
                  select: {
                    experience: {
                      select: this.createSelectInput(),
                    },
                  },
                },
              },
            },
          },
        },
      },
      where: {
        id: characterId,
        deleted_at: null,
      },
    });

    const snapshot = character?.last_snapshot?.snapshot;

    if (!snapshot) {
      throw new NotFoundException(`캐릭터 스냅샷이 존재하지 않습니다. id: ${characterId}`);
    }

    /**
     * mapping
     */
    return snapshot.character_snapshot_experiences.map((el) => this.mapping(el.experience));
  }

  /**
   * 경력들의 시작 날짜와 종료날짜를 받아 연차를 계산한다.
   */
  getExperienceYears(input: Array<Pick<Experience.GetResponse, 'startDate' | 'endDate'>>): number {
    const totalMonths = input.reduce((acc, el) => {
      return acc + DateTimeUtil.BetweenMonths(el.startDate, el.endDate);
    }, 0);

    const totalYears = Math.floor(totalMonths / 12) + 1;

    return totalYears;
  }

  /**
   * 멤버의 특정 경력을 조회한다.
   */
  async get(memberId: string, id: Experience['id']): Promise<Experience.GetResponse> {
    const experience = await this.prisma.experience.findUnique({
      select: this.createSelectInput(),
      where: { id, member_id: memberId, deleted_at: null },
    });

    if (!experience) {
      throw new NotFoundException(`존재하지 않는 경력입니다.`);
    }
    /**
     * mapping
     */
    return this.mapping(experience);
  }

  /**
   * 멤버의 경력을 수정합니다.
   * 캐릭터 스냅샷관 연관 관계가 있을 경우 영향을 받습니다.
   */
  async update(
    memberId: string,
    id: Experience['id'],
    body: Experience.UpdateRequest,
  ): Promise<Experience.GetResponse | null> {
    const experience = await this.get(memberId, id);
    const isChanged = ObjectUtil.isChanged(experience, body, [
      'companyName',
      'description',
      'position',
      'startDate',
      'endDate',
    ]);

    if (!isChanged) {
      return null;
    }
    const newSnapshot = await this.updateLastSnapshot(id, experience.sequence, body);

    /**
     * mapping
     */
    return {
      id: experience.id,
      createdAt: experience.createdAt,
      companyName: newSnapshot.company_name,
      position: newSnapshot.position,
      description: newSnapshot.description,
      startDate: newSnapshot.start_date,
      endDate: newSnapshot.end_date,
      sequence: newSnapshot.sequence,
    };
  }

  /**
   * 경력을 soft-del 처리합니다. 캐릭터 스냅샷에 영향을 줍니다.
   */
  async delete(memberId: string, id: Experience['id']): Promise<void> {
    const experience = await this.get(memberId, id);
    const date = DateTimeUtil.now();

    await this.prisma.$transaction(async (tx) => {
      await tx.experience.update({
        where: { id },
        data: { deleted_at: date },
      });

      await tx.character_Snapshot_Experience.updateMany({
        where: { experience_id: id },
        data: { deleted_at: date },
      });
    });
  }

  /**
   * 캐릭터 스냅샷과의 경력 관계를 추가한다.
   *
   * @param tx 프리즈마 트랜잭션 클라이언트 객체
   * @param characterSnapshotId 캐릭터 스냅샷 아이디
   * @param newData 추가하려는 경력 아이디
   * @param createdAt 트랜잭션 시작 시점
   */
  async updateSnapshotMany(
    tx: Prisma.TransactionClient,
    characterSnapshotId: Character['id'],
    body: Array<Pick<Experience, 'id'>>,
    createdAt: string,
  ) {
    const createInput = body.map((el): Prisma.Character_Snapshot_ExperienceCreateManyInput => {
      return {
        character_snapshot_id: characterSnapshotId,
        experience_id: el.id,
        created_at: createdAt,
      };
    });

    return await tx.character_Snapshot_Experience.createMany({ data: createInput });
  }

  /**
   * 특정 경력의 스냅샷을 새로 생성하고, last 스냅샷을 갱신합니다.
   */
  private async updateLastSnapshot(
    id: Experience['id'],
    sequence: Experience['sequence'],
    body: Experience.UpdateRequest,
  ) {
    const date = DateTimeUtil.now();

    return await this.prisma.$transaction(async (tx) => {
      const newSnapshot = await tx.experience_Snapshot.create({
        data: {
          id: randomUUID(),
          experience_id: id,
          company_name: body.companyName,
          position: body.position,
          start_date: body.startDate,
          end_date: body.endDate,
          description: body.description,
          sequence: sequence,
          created_at: date,
        },
      });

      await tx.experience_Last_Snapshot.update({
        where: { experience_id: id },
        data: { experience_snapshot_id: newSnapshot.id },
      });

      return newSnapshot;
    });
  }
}
