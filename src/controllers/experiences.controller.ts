import core, { TypedBody } from '@nestia/core';
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
    @TypedBody() body: Experience.CreateRequest,
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
}
