import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Experience } from 'src/interfaces/experiences.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class ExperiencesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(
    memberId: string,
    body: Experience.CreateRequest,
  ): Promise<void> {
    const { experiences } = body;
    const date = DateTimeUtil.now();

    const createInput = experiences.map(
      (el, index): Prisma.ExperienceCreateManyInput => {
        return {
          id: randomUUID(),
          member_id: memberId,
          company_name: el.companyName,
          position: el.position,
          description: el.description,
          start_date: new Date(el.startDate).toISOString(),
          end_date: new Date(el.endDate).toISOString(),
          sequence: index,
          created_at: date,
        };
      },
    );

    await this.prisma.experience.createMany({
      data: createInput,
    });
  }
}
