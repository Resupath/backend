import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Contacts } from 'src/interfaces/contacts.interface';
import { Member } from 'src/interfaces/member.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
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

  /**
   * 연락하기 메시지를 페이지네이션으로 조회합니다.
   *
   * @param query 페이지네이션 요청 객체
   * @param options 조회 옵셔널 파라미터들 입니다.
   *
   * - memberId: 특정 멤버가 보낸 메시지를 조회하고 싶다면, 멤버 아이디를 입력합니다.
   */
  async getByPage(
    query: Contacts.GetByPageRequest,
    options?: {
      memberId?: Member['id'];
    },
  ): Promise<Contacts.GetByPageResponse> {
    const { skip, take } = PaginationUtil.getOffset(query);

    const whereInput: Prisma.ContactWhereInput = {
      member_id: options?.memberId,
    };

    const [contacts, count] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        select: {
          id: true,
          member: {
            select: {
              id: true,
              name: true,
            },
          },
          character_id: true,
          purpose: true,
          message: true,
          status: true,
          created_at: true,
        },
        orderBy: { created_at: 'desc' },
        where: whereInput,
        skip,
        take,
      }),
      this.prisma.contact.count({ where: whereInput }),
    ]);

    /**
     * mapping
     */
    const data = contacts.map((el): Contacts.GetByPageData => {
      return {
        id: el.id,
        characterId: el.character_id,
        purpose: el.purpose,
        message: el.message,
        status: el.status as Contacts['status'],
        createdAt: el.created_at.toISOString(),
        member: {
          id: el.member.id,
          name: el.member.name,
        },
      };
    });

    return PaginationUtil.createResponse({
      data,
      skip,
      count,
      take,
    });
  }
}
