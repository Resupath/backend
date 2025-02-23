import core from '@nestia/core';
import { Body, Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { Common } from 'src/interfaces/common.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { CharactersService } from 'src/services/characters.service';
import { ExperiencesService } from 'src/services/experiences.service';

@ApiTags('Character')
@Controller('characters')
export class CharactersController {
  constructor(
    private readonly charactersService: CharactersService,
    private readonly experiencesService: ExperiencesService,
  ) {}

  /**
   * 캐릭터를 생성한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post()
  async createCharacater(
    @Member() member: Guard.MemberResponse,
    @core.TypedBody() body: Character.CreateRequest,
  ): Promise<Character.CreateResponse> {
    return await this.charactersService.create(member.id, body);
  }

  /**
   * 캐릭터를 페이지네이션으로 조회한다.
   */
  @core.TypedRoute.Get()
  async getCharactersByPage(@core.TypedQuery() query: Character.GetByPageRequest) {
    return await this.charactersService.getBypage(query, { isPublic: true });
  }

  /**
   * 캐릭터의 경력들을 조회한다.
   */
  @core.TypedRoute.Get(':id/experiences')
  async getCharacterExperiences(@core.TypedParam('id') id: Character['id']) {
    return await this.experiencesService.getAllByCharacterId(id);
  }

  /**
   * 아이디로 캐릭터를 조회한다.
   */
  @core.TypedRoute.Get(':id')
  async getCharacter(@core.TypedParam('id') id: Character['id']) {
    return await this.charactersService.get(id, { isPublic: true });
  }

  /**
   * 캐릭터를 수정한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Patch(':id')
  async updateCharacter(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('id') id: Character['id'],
    @core.TypedBody() body: Character.UpdateRequest,
  ): Promise<Common.Response> {
    await this.charactersService.update(member.id, id, body);
    return { message: '캐릭터가 수정되었습니다.' };
  }
}
