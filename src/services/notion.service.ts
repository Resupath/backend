import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from '@notionhq/client';
import { NotionToMarkdown } from 'notion-to-md';
import { Source } from 'src/interfaces/source.interface';
import { NotionUtil } from 'src/util/notion.util';
import { AuthService } from './auth.service';

@Injectable()
export class NotionService {
  constructor(private readonly authService: AuthService) {}

  /**
   * 프라이빗 노션 링크인지 검증한다.
   * id가 정규식에 의해 추출된다면 반환하고, 아니라면 Exception이 발생한다.
   *
   * @param url 검증할 url
   */
  verifyNotionUrl(url: Source['url']): string {
    const id = this.getPrivateNotionId(url);

    if (!id) {
      throw new NotFoundException('지원하는 노션 url 형식이 아닙니다.');
    }
    return id;
  }

  /**
   * 멤버 아이디를 바탕으로 노션 연동정보를 확인하고 페이지 콘텐츠를 마크다운으로 변환한다.
   * @param memberId
   * @param url 노션 연동 확인을 위한
   */
  async notionToMarkdownByMemberId(memberId: string, url: Source['url']): Promise<string> {
    const id = this.verifyNotionUrl(url);
    const { password: accessToken } = await this.authService.getNotionAccessTokenByMemberId(memberId);

    return await this.getNotionToMd(accessToken, id);
  }

  /**
   * 노션 private url에서 페이지의 id를 추출한다.
   *
   * private url 형식이 아니거나 id가 추출되지 않으면 null을 반환한다.
   */
  private getPrivateNotionId(url: string): string | null {
    const match = url.match(NotionUtil.privateNotionIdRegex);
    return match ? match[2] : null;
  }

  /**
   * NotionToMd 라이브러리를 사용해 노션 콘텐츠를 마크다운으로 변경한다.
   *
   * https://www.npmjs.com/package/notion-to-md
   *
   * @param accessToken 노션 OAuth Access Token
   * @param id 변환할 노션 페이지의 아이디
   */
  private async getNotionToMd(accessToken: string, id: string): Promise<string> {
    try {
      const notionClient = new Client({ auth: accessToken });
      const n2m = new NotionToMarkdown({ notionClient, config: { separateChildPage: false } });
      const mdblocks = await n2m.pageToMarkdown(id);
      const mdString = n2m.toMarkdownString(mdblocks);

      return mdString?.parent ?? '';
    } catch (err) {
      throw new NotFoundException('노션 콘텐츠 마크다운 변환에 실패했습니다.');
    }
  }
}
