import core, { TypedBody } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Experience } from 'src/interfaces/experiences.interface';
import { ExperiencesService } from '../services/experiences.service';

@UseGuards(MemberGuard)
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  /**
   * 경력들을 생성한다.
   */
  @core.TypedRoute.Post()
  async createExperiences(
    @User() user: { id: string },
    @TypedBody() body: Experience.CreateRequest,
  ) {
    return await this.experiencesService.create(user.id, body);
  }

  /**
   * @todo 경력들을 조회한다.
   */
  @core.TypedRoute.Get()
  async getExperiences(@User() user: { id: string }) {
    return;
  }
}
