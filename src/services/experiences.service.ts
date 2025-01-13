import { Injectable, NotFoundException } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Experience } from 'src/interfaces/experiences.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

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

  createOutputs(experiences): Array<Experience.GetResponse> {
    return experiences.map((el): Experience.GetResponse => this.mappingOutput(el));
  }

  async createMany(memberId: string, body: Experience.CreateRequest): Promise<Array<Experience.GetResponse>> {
    const { experiences } = body;
    const date = DateTimeUtil.now();

    const id = randomUUID();
    const snapshotId = randomUUID();

    const newExperiences = await this.prisma.$transaction(async (tx) => {
      return await Promise.all(
        experiences.map((el) =>
          tx.experience.create({
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
          }),
        ),
      );
    });

    return this.createOutputs(newExperiences);
  }

  async getAll(memberId: string): Promise<Array<Experience.GetResponse>> {
    const experiences = await this.prisma.experience.findMany({
      select: this.createSelectInput(),
      where: { member_id: memberId, deleted_at: null },
      orderBy: { last_snapshot: { snapshot: { sequence: 'asc' } } },
    });

    return this.createOutputs(experiences);
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

  private mappingOutput(experience): Experience.GetResponse {
    const snapshot = experience.last_snapshot?.snapshot;
    if (!snapshot) {
      throw new NotFoundException();
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
}
