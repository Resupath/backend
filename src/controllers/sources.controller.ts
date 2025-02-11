import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Member } from 'src/decorators/member.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { Guard } from 'src/interfaces/guard.interface';
import { Source } from 'src/interfaces/source.interface';
import { NotionService } from 'src/services/notion.service';
import { SourcesService } from 'src/services/sources.service';
import { NotionUtil } from 'src/util/notion.util';

@ApiTags('Source')
@Controller('sources')
export class SourcesController {
  constructor(
    private readonly sourcesService: SourcesService,
    private readonly notionService: NotionService,
  ) {}

  /**
   * 소스를 저장한다. 소스는 link, file 타입으로 나뉘며 자기소개서나, 이력서를 받을때 사용한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post('/:characterId')
  async createSource(
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedBody() body: Source.CreateRequest,
  ) {
    return await this.sourcesService.create(characterId, body);
  }

  /**
   * 소스 여러개를 저장한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post('/bulk/:characterId')
  async createSources(
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedBody() body: Array<Source.CreateRequest>,
  ): Promise<Source.GetAllResponse> {
    return await this.sourcesService.createMany(characterId, body);
  }

  /**
   * 캐릭터의 특정 소스를 조회한다.
   */
  @core.TypedRoute.Get('/:characterId/:id')
  async getSource(
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedParam('id') id: Source['id'],
  ): Promise<Source.GetResponse> {
    return await this.sourcesService.get(characterId, id);
  }

  /**
   * 캐릭터의 특정 소스를 수정한다. 변경된 내용이 있을때만 수정한다.
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Patch('/:characterId/:id')
  async updateSource(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedParam('id') id: Source['id'],
    @core.TypedBody() body: Source.UpdateRequest,
  ) {
    const updatedSource = await this.sourcesService.update(member.id, characterId, id, body);
    return updatedSource ?? { message: '변경된 내용이 없습니다.' };
  }

  /**
   * 캐릭터의 특정 소스를 삭제한다. (soft-del)
   *
   * @security x-member bearer
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Delete('/:characterId/:id')
  async deleteSource(
    @Member() member: Guard.MemberResponse,
    @core.TypedParam('characterId') characterId: Source['characterId'],
    @core.TypedParam('id') id: Source['id'],
  ) {
    await this.sourcesService.delete(member.id, characterId, id);
    return { message: '첨부 파일이 삭제되었습니다. ' };
  }

  /**
   * 캐릭터에 저장된 소스들을 조회한다.
   */
  @core.TypedRoute.Get('/:characterId')
  async getSources(@core.TypedParam('characterId') characterId: Source['characterId']): Promise<Source.GetAllResponse> {
    return await this.sourcesService.getAll(characterId);
  }

  /**
   * 프로젝트에서 id 추출을 지원하는 노션 링크인지 검증한다. 지원하는 url 아니라면 exception이 발생한다.
   */
  @core.TypedRoute.Post('/notion/verify')
  async verifyNotionUrl(@core.TypedBody() body: Pick<Source, 'url'>): Promise<NotionUtil.VerifyUrlResponse> {
    const pageId = this.notionService.verifyNotionUrl(body.url);
    return { pageId };
  }

  /**
   * 노션 링크를 받아 콘텐츠를 읽어 마크다운 문자열로 변환한다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post('/notion/markdown')
  async notionToMarkdown(
    @Member() member: Guard.MemberResponse,
    @core.TypedBody() body: Pick<Source, 'url'>,
  ): Promise<NotionUtil.ToMarkdownResponse> {
    const content = await this.notionService.notionToMarkdownByMemberId(member.id, body.url);
    return { content };
  }
}
