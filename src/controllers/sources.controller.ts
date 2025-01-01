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

  /**
   * 소스 여러개를 저장한다.
   */
  @core.TypedRoute.Post('/bulk/:characterId')
  async createSources(
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedBody() body: Array<Source.CreateRequest>,
  ): Promise<{ count: number }> {
    return await this.sourcesService.createMany(characterId, body);
  }

  /**
   * 캐릭터에 저장된 소스들을 조회한다.
   */
  @core.TypedRoute.Get('/:characterId')
  async getSources(
    @core.TypedParam('characterId') characterId: Source['characterId'],
  ): Promise<Source.GetAllResponse> {
    return await this.sourcesService.getAll(characterId);
  }
}
