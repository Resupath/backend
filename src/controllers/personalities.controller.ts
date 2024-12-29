import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemberGuard } from 'src/guards/member.guard';
import { Personality } from 'src/interfaces/personalities.interface';
import { PersonalitiesService } from 'src/services/personalities.service';

@ApiTags('Personalitie')
@Controller('personalities')
export class PersonalitiesController {
  constructor(private readonly personalitiesService: PersonalitiesService) {}

  /**
   * 성격 데이터를 생성한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post('bulk')
  async createPersonalities(
    @core.TypedBody() body: Personality.CreateBulkRequest,
  ): Promise<void> {
    return this.personalitiesService.createBulk(body);
  }

  /**
   * 성격을 페이지네이션으로 조회한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get()
  async getPersonalitiesByPage(
    @core.TypedQuery() query: Personality.GetByPageRequest,
  ): Promise<Personality.GetByPageResonse> {
    return this.personalitiesService.getByPage(query);
  }
}
