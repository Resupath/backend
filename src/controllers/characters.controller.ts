import core, { TypedBody } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { User } from 'src/decorators/user.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { CharactersService } from 'src/services/characters.service';

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
    @TypedBody() body: Character.CreateCharacterRequest,
  ): Promise<Character.CreateCharacterResponse> {
    return await this.charactersService.create(user.id, body);
  }
}
