import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { MemberGuard } from 'src/guards/member.guard';
import { Skill } from 'src/interfaces/skills.interface';
import { SkillsService } from 'src/services/skills.service';

@ApiTags('Skill')
@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}

  /**
   * 스킬을 생성한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post()
  async createSkill(
    @core.TypedBody() body: Skill.CreateRequest,
  ): Promise<Skill.CreateResponse> {
    return await this.skillsService.create(body);
  }

  /**
   * 스킬을 페이지네이션으로 조회한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get()
  async getPositionByPage(
    @core.TypedQuery() query: Skill.GetByPage,
  ): Promise<Skill.GetByPageResponse> {
    return await this.skillsService.getByPage(query);
  }
}
