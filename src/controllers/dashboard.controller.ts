import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { DashboardService } from '../services/dashboard.service';
import { Dashboard } from 'src/interfaces/dashboard.interface';
import { ApiTags } from '@nestjs/swagger';

@ApiTags('Dashboard')
@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  /**
   * 랜딩 페이지용 통계데이터를 반환합니다.
   */
  @core.TypedRoute.Get()
  async getDashboard(): Promise<Dashboard> {
    return await this.dashboardService.get();
  }
}
