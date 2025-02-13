import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Personality } from 'src/interfaces/personalities.interface';
import { PersonalitiesService } from 'src/services/personalities.service';

@ApiTags('Personalitie')
@Controller('personalities')
export class PersonalitiesController {
  constructor(private readonly personalitiesService: PersonalitiesService) {}

  /**
   * 성격을 전체 조회한다.
   */
  @core.TypedRoute.Get('/all')
  async getPersonalities(): Promise<Array<Personality.GetResponse>> {
    return this.personalitiesService.getAll();
  }

  /**
   * 성격을 페이지네이션으로 조회한다.
   */
  @core.TypedRoute.Get()
  async getPersonalitiesByPage(
    @core.TypedQuery() query: Personality.GetByPageRequest,
  ): Promise<Personality.GetByPageResponse> {
    return this.personalitiesService.getByPage(query);
  }
}
