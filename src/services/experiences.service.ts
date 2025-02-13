import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Experience } from 'src/interfaces/experiences.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { ObjectUtil } from 'src/util/object.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * experience에 대한 프리즈마 select where input을 반환합니다.
   * 반복되는 스냅샷 select 문을 대체 할때 사용합니다.
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
   * createSelectInput()의 select 결과물을
   * Experience.GetResponse 으로 조합합니다.
   *
   * @param experience
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
   * 멤버의 경력 정보를 여러개 생성합니다. (트랜잭션 사용됨)
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
    const isChanged = ObjectUtil.isChanged(experience, body);

    if (!isChanged) {
      return null;
    }
    const newSnapshot = await this.updateSnapshot(id, experience.sequence, body);

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
   * 경력을 soft-del 처리합니다.
   * 캐릭터 스냅샷에 영향주지 않습니다.
   */
  async delete(memberId: string, id: Experience['id']): Promise<void> {
    const experience = await this.get(memberId, id);
    const date = DateTimeUtil.now();

    await this.prisma.experience.update({
      where: { id },
      data: { deleted_at: date },
    });
  }

  /**
   * 특정 경력의 스냅샷을 새로 생성하고, last 스냅샷을 갱신합니다.
   */
  private async updateSnapshot(id: Experience['id'], sequence: Experience['sequence'], body: Experience.UpdateRequest) {
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
