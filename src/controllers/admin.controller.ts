import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Personality } from 'src/interfaces/personalities.interface';
import { PersonalitiesService } from 'src/services/personalities.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(private readonly personalitiesService: PersonalitiesService) {}

  /**
   * 성격 데이터를 생성한다. 중복된 키워드는 한번만 저장된다.
   */
  @core.TypedRoute.Post('personalities/bulk')
  async createPersonalities(@core.TypedBody() body: Personality.CreateBulkRequest): Promise<void> {
    return this.personalitiesService.createBulk(body);
  }
}
