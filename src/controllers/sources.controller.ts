import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Source } from 'src/interfaces/source.interface';
import { SourcesService } from 'src/services/sources.service';

@ApiTags('Source')
@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}

  /**
   * 소스를 저장한다. 소스는 link, file 타입으로 나뉘며 자기소개서나, 이력서를 받을때 사용한다.
   */
  @core.TypedRoute.Post('/:characterId')
  async createSource(
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedBody() body: Source.CreateRequest,
  ) {
    return await this.sourcesService.create(characterId, body);
  }
}
