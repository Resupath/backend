import core, { TypedBody } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Experience } from 'src/interfaces/experiences.interface';
import { ExperiencesService } from '../services/experiences.service';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  /**
   * 경력들을 생성한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post()
  async createExperiences(
    @User() user: { id: string },
    @TypedBody() body: Experience.CreateRequest,
  ): Promise<void> {
    return await this.experiencesService.create(user.id, body);
  }

  /**
   * 경력들을 조회한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get()
  async getAllExperiences(
    @User() user: { id: string },
  ): Promise<Experience.GetAllResponse> {
    return await this.experiencesService.getAll(user.id);
  }
}
