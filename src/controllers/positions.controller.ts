import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { MemberGuard } from 'src/guards/member.guard';
import { Position } from 'src/interfaces/positions.interface';
import { PositionsService } from 'src/services/positions.service';

@Controller('positions')
export class PositionsController {
  constructor(private readonly positionsService: PositionsService) {}

  /**
   * 직군을 생성한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post()
  async createPosition(
    @core.TypedBody() body: Position.CreateRequest,
  ): Promise<Position.CreateResponse> {
    return await this.positionsService.create(body);
  }

  /**
   * 직군을 페이지네이션으로 조회한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get()
  async getPositionByPage(
    @core.TypedQuery() query: Position.GetByPageRequest,
  ): Promise<Position.GetByPageResponse> {
    return await this.positionsService.getByPage(query);
  }
}
