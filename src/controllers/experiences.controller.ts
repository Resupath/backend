import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Experience } from 'src/interfaces/experiences.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { ExperiencesService } from '../services/experiences.service';

@ApiTags('Experience')
@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}

  /**
   * 경력들을 생성한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post()
  async createExperiences(
    @Member() member: Guard.MemberResponse,
    @core.TypedBody() body: Experience.CreateManyRequest,
  ): Promise<Array<Experience.GetResponse>> {
    return await this.experiencesService.createMany(member.id, body);
  }

  /**
   * 경력들을 조회한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get()
  async getAllExperiences(@Member() member: Guard.MemberResponse): Promise<Array<Experience.GetResponse>> {
    return await this.experiencesService.getAll(member.id);
  }

  /**
   * 경력을 수정한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Patch('/:id')
  async updateExperience(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('id') id: Experience['id'],
    @core.TypedBody() body: Experience.UpdateRequest,
  ): Promise<Experience.UpdateResponse> {
    return await this.experiencesService.update(member.id, id, body);
  }
}
