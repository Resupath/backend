import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Character } from 'src/interfaces/characters.interface';
import { Personality } from 'src/interfaces/personalities.interface';
import { CharactersService } from 'src/services/characters.service';
import { PersonalitiesService } from 'src/services/personalities.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly personalitiesService: PersonalitiesService,
    private readonly charactersService: CharactersService,
  ) {}

  /**
   * 성격 데이터를 생성한다. 중복된 키워드는 한번만 저장된다.
   */
  @core.TypedRoute.Post('personalities/bulk')
  async createPersonalities(@core.TypedBody() body: Personality.CreateBulkRequest): Promise<void> {
    return this.personalitiesService.createBulk(body);
  }

  /**
   * 캐릭터를 조회한다. 사용자가 삭제한 캐릭터도 조회된다.
   */
  @core.TypedRoute.Get('characters')
  async getCharacters(@core.TypedQuery() query: Character.GetByPageRequest): Promise<Character.GetByPageResponse> {
    return await this.charactersService.getBypage(query, { deletedAt: true });
  }
}
