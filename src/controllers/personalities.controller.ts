import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { MemberGuard } from 'src/guards/member.guard';
import { Personality } from 'src/interfaces/personalities.interface';
import { PersonalitiesService } from 'src/services/personalities.service';

@Controller('personalities')
export class PersonalitiesController {
  constructor(private readonly personalitiesService: PersonalitiesService) {}

  /**
   * 성격을 페이지네이션으로 조회한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get()
  async getPersonalitiesByPage(
    @core.TypedQuery() query: Personality.GetByPageRequest,
  ) {
    return this.personalitiesService.getByPage(query);
  }
}
