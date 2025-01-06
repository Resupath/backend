import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Member } from 'src/interfaces/member.interface';
import { Provider } from 'src/interfaces/provider.interface';

@Injectable()
export class MembersService {
  constructor(private readonly prisma: PrismaService) {}

  async get(id: Member['id']): Promise<Member.GetResponse> {
    const member = await this.prisma.member.findUnique({
      select: {
        id: true,
        name: true,
        created_at: true,
        providers: {
          select: {
            id: true,
            type: true,
            created_at: true,
          },
        },
      },
      where: { id },
    });

    if (!member) {
      throw new NotFoundException();
    }

    /**
     * mapping
     */
    return {
      id: member.id,
      name: member.name,
      createdAt: member.created_at.toISOString(),
      providers: member.providers.map((el) => {
        return {
          id: el.id,
          type: el.type as Provider['type'],
          createdAt: el.created_at.toISOString(),
        };
      }),
    };
  }
}
