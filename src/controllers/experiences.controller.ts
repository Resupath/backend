import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Character } from 'src/interfaces/characters.interface';
import { Common } from 'src/interfaces/common.interface';
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
   * 특정 경력을 사용하고 있는 캐릭터들을 반환한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get('/:id/characters')
  async getCharacters(
    @core.TypedParam('id') id: Experience['id'],
  ): Promise<Array<Pick<Character, 'id' | 'nickname' | 'image' | 'isPublic' | 'createdAt'>>> {
    return await this.experiencesService.getCharacters(id);
  }

  /**
   * 경력을 조회한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Get('/:id')
  async getExperience(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('id') id: Experience['id'],
  ): Promise<Experience.GetResponse> {
    return await this.experiencesService.get(member.id, id);
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
  ): Promise<Experience.GetResponse | Common.Response> {
    const experience = await this.experiencesService.update(member.id, id, body);
    return experience ?? { message: '수정된 내용이 없습니다.' };
  }

  /**
   * 경력을 삭제한다. 등록된 캐릭터가 있다면 이후 생성되는 채팅에 영향을 줍니다.
   * 수정 이전의 채팅방의 경우 유지됩니다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Delete('/:id')
  async deleteExperience(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('id') id: Experience['id'],
  ): Promise<Common.Response> {
    await this.experiencesService.delete(member.id, id);
    return { message: '경력이 삭제되었습니다.' };
  }
}
