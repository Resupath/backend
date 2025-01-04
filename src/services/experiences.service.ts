import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Experience } from 'src/interfaces/experiences.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(memberId: string, body: Experience.CreateRequest): Promise<void> {
    const { experiences } = body;
    const date = DateTimeUtil.now();

    const createInput = experiences.map((el): Prisma.ExperienceCreateManyInput => {
      return {
        id: randomUUID(),
        member_id: memberId,
        company_name: el.companyName,
        position: el.position,
        description: el.description,
        start_date: el.startDate,
        end_date: el.endDate,
        sequence: el.sequence,
        created_at: date,
      };
    });

    await this.prisma.experience.createMany({
      data: createInput,
    });
  }

  async getAll(memberId: string): Promise<Experience.GetAllResponse> {
    const experiences = await this.prisma.experience.findMany({
      select: {
        id: true,
        company_name: true,
        position: true,
        description: true,
        start_date: true,
        end_date: true,
        sequence: true,
      },
      where: { member_id: memberId, deleted_at: null },
      orderBy: { sequence: 'asc' },
    });

    /**
     * mapping
     */
    return experiences.map((el): Experience.GetResponse => {
      return {
        id: el.id,
        companyName: el.company_name,
        position: el.position,
        description: el.description,
        startDate: el.start_date,
        endDate: el.end_date,
        sequence: el.sequence,
      };
    });
  }
}
