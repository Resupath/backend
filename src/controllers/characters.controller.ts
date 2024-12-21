import core, { TypedBody } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { CharactersService } from 'src/services/characters.service';

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
}
