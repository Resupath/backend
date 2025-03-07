import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { Contacts } from 'src/interfaces/contacts.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { ContactsService } from 'src/services/contacts.service';

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
}
