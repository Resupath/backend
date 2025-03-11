import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { Contacts } from 'src/interfaces/contacts.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { ContactsService } from 'src/services/contacts.service';
import { PaginationUtil } from 'src/util/pagination.util';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  /**
   * 연락하기 기능입니다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post('/:characterId')
  async createContact(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('characterId') characterId: Character['id'],
    @core.TypedBody() body: Contacts.CreateRequst,
  ): Promise<Contacts.GetResponse> {
    return this.contactsService.create(member.id, characterId, body);
  }

  /**
   * 연락하기 기능으로 작성한 메시지를 페이지네이션으로 조회합니다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get('')
  async getContactsByPage(
    @Member() member: Guard.MemberResponse,
    @core.TypedQuery() query: Contacts.GetByPageRequest,
  ): Promise<Contacts.GetByPageResponse> {
    return this.contactsService.getByPage(query, { memberId: member.id });
  }
}
