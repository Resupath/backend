import core, { TypedBody, TypedParam, TypedQuery } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { CharactersService } from 'src/services/characters.service';
import { PaginationUtil } from 'src/util/pagination.util';
import { tags } from 'typia';

@ApiTags('Character')
@Controller('characters')
export class CharactersController {
  constructor(private readonly charactersService: CharactersService) {}

  /**
   * 캐릭터를 생성한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post()
  async createCharacater(
    @User() user: { id: string },
    @TypedBody() body: Character.CreateRequest,
  ): Promise<Character.CreateResponse> {
    return await this.charactersService.create(user.id, body);
  }

  /**
   * 캐릭터를 페이지네이션으로 조회한다.
   */
  @core.TypedRoute.Get()
  async getCharactersByPage(@TypedQuery() query: Character.GetByPageRequest) {
    return await this.charactersService.getBypage(query);
  }

  /**
   * 아이디로 캐릭터를 조회한다.
   */
  @core.TypedRoute.Get(':id')
  async getCharacter(@TypedParam('id') id: string & tags.Format<'uuid'>) {
    return await this.charactersService.get(id);
  }
}