import { Controller, UseGuards } from '@nestjs/common';
import { ExperiencesService } from '../services/experiences.service';
import core, { TypedBody } from '@nestia/core';
import { MemberGuard } from 'src/guards/member.guard';
import { Experience } from 'src/interfaces/experiences.interface';
import { User } from 'src/decorators/user.decorator';

@UseGuards(MemberGuard)
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  /**
   * @todo 경력들을 생성한다.
   */
  @core.TypedRoute.Post()
  async createExperiences(@TypedBody() body: Experience.CreateRequest[]) {
    return;
  }

  /**
   * @todo 경력들을 조회한다.
   */
  @core.TypedRoute.Get()
  async getExperiences(@User() user: { id: string }) {
    return;
  }
}
