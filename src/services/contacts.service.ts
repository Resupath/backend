import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Contacts } from 'src/interfaces/contacts.interface';
import { Member } from 'src/interfaces/member.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class ContactsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 연락하기 기능으로 요청된 메시지를 저장합니다.
   */
  async create(
    memberId: Member['id'],
    characterId: Character['id'],
    body: Contacts.CreateRequst,
  ): Promise<Contacts.GetResponse> {
    const date = DateTimeUtil.now();
    const status: Contacts['status'] = 'pending';

    const contact = await this.prisma.contact.create({
      select: {
        id: true,
        member_id: true,
        character_id: true,
        purpose: true,
        message: true,
        status: true,
        created_at: true,
      },
      data: {
        id: randomUUID(),
        member_id: memberId,
        character_id: characterId,
        message: body.message,
        purpose: body.purpose,
        status: status,
        created_at: date,
      },
    });

    return {
      id: contact.id,
      memberId: contact.member_id,
      characterId: contact.character_id,
      purpose: contact.purpose,
      message: contact.message,
      status: contact.status as Contacts['status'],
      createdAt: contact.created_at.toISOString(),
    };
  }
}
