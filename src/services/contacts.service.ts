import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { Character } from 'src/interfaces/characters.interface';
import { Contacts } from 'src/interfaces/contacts.interface';
import { Member } from 'src/interfaces/member.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { PaginationUtil } from 'src/util/pagination.util';
import { PrismaService } from './prisma.service';
import { Guard } from 'src/interfaces/guard.interface';
import { Format } from 'typia/lib/tags';

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

  /**
   * 연락하기 메시지를 상세 조회합니다.
   * @param id
   */
  async get(id: Contacts['id']): Promise<Contacts.GetResponse> {
    const contact = await this.prisma.contact.findUnique({
      select: {
        id: true,
        member_id: true,
        character_id: true,
        purpose: true,
        message: true,
        status: true,
        created_at: true,
      },
      where: { id: id },
    });

    if (!contact) {
      throw new NotFoundException(`연락하기 메시지 조회 실패. 존재하지 않거나 삭제된 메시지입니다.`);
    }

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
   * 메시지의 상태를 수정합니다. (admin 용)
   */
  async updateStatus(id: Contacts['id'], status: Contacts['status']): Promise<Contacts.GetResponse> {
    const contact = await this.prisma.contact.update({
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
        status: status,
      },
      where: { id: id },
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
