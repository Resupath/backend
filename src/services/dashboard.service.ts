import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import { Dashboard } from 'src/interfaces/dashboard.interface';

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * 랜딩 페이지 통계데이터를 조회한다.
   */
  async get(): Promise<Dashboard> {
    const characterCount = await this.prisma.character.count();
    const roomCount = await this.prisma.room.count();
    const chatCount = await this.prisma.chat.count();

    return {
      characterCount,
      roomCount,
      chatCount,
    };
  }
}
