import core, { TypedQuery } from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { CharactersService } from 'src/services/characters.service';
import { MembersService } from 'src/services/members.service';

@ApiTags('Member')
@UseGuards(MemberGuard)
@Controller('members')
export class MembersController {
  constructor(
    private readonly membersService: MembersService,
    private readonly charactersService: CharactersService,
  ) {}

  /**
   * 회원 정보를 조회한다.
   */
  @core.TypedRoute.Get('info')
  async getMember(@Member() member: Guard.MemberResponse) {
    return 1;
  }

  /**
   * 회원의 캐릭터 정보들를 페이지 네이션으로 조회한다.
   */
  @core.TypedRoute.Get('characters')
  async getCharacters(@Member() member: Guard.MemberResponse) {
    return 1;
  }
}
