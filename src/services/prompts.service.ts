import { Injectable, NotFoundException } from '@nestjs/common';
import { Client } from '@notionhq/client';
import axios from 'axios';
import { NotionToMarkdown } from 'notion-to-md';
import { Character } from 'src/interfaces/characters.interface';
import { Source } from 'src/interfaces/source.interface';
import { NotionUtil } from 'src/util/notion.util';
import { AuthService } from './auth.service';

@Injectable()
export class PromptsService {
  constructor(private readonly authService: AuthService) {}

  async prompt(userId: string, input: Character.GetResponse): Promise<string> {
    const prompt = [
      `# 1. 반드시 지켜야 할 사항:`,
      this.addPolicy(),
      `# 2. 유저가 입력한 정보는 다음과 같다:`,
      ``,
      `## 성격과 대답 스타일 설정`,
      this.formatKeywords(input.personalities),
      ``,
      `## 기본 정보`,
      `- 이름: ${input.nickname}`,
      `- 직무: ${this.formatKeywords(input.positions)}`,
      `- 사용 기술: ${this.formatKeywords(input.skills)}`,
      `- 경력: ${input.experienceYears}년`,
      ``,
      `## 회사 경력`,
      this.addExperiences(input.experiences),
      ``,
      `## 첨부 자료`,
      await this.addSources(userId, input.sources),
      ``,
      `# 3. 이제 면접관(유저)이 질문을 시작할 것이다:`,
      this.addIntro(),
    ];

    return prompt.join(`\n`);
  }

  private addPolicy(): string {
    return [
      `- 지금부터 가상 면접을 진행합니다. 면접관은 유저이며, 나는 면접 대상자로 행동합니다.`,
      `- 기술적 지식, 문제 해결 경험, 협업 사례, 적응력, 인성에 관한 질문에만 답변합니다.`,
      `- 모든 답변은 제공된 정보만을 바탕으로 논리적이고 일관성 있게 작성합니다.`,
      `- 새로운 정보나 허위 내용을 지어내지 않습니다.`,
      `- 면접과 관련 없는 질문이 주어지면 면접 화제로 유도합니다.`,
      `- AI 또는 에이전트임을 절대 드러내지 않습니다.`,
    ].join(`\n`);
  }

  private addIntro(): string {
    return [
      `- 모든 답변은 공손하며, 간결하고 논리적인 구조를 따른다.`,
      `- 구체적인 예시와 실질적 경험을 포함하여 신뢰성을 높인다.`,
      `- 핵심 내용을 강조하되 불필요한 반복을 피한다.`,
      `- 솔직하고 성실하게 답변하며, 모르는 부분이 있다면 학습 의지를 표현한다.`,
      `- 협업과 문제 해결 과정에서 배운 점을 설명하는 것을 중요시한다.`,
    ].join(`\n`);
  }

  private formatKeywords(
    input:
      | Character.GetResponse['positions']
      | Character.GetResponse['skills']
      | Character.GetResponse['personalities'],
  ): string {
    return input.map((el) => el.keyword).join(', ');
  }

  private addExperiences(input: Character.GetResponse['experiences']): string {
    return input
      .map((el) => {
        return [
          `### 회사명: ${el.companyName}`,
          `- 근무 기간: ${el.startDate} ~ ${el.endDate ?? '현재'}`,
          `- 직무: ${el.position}`,
          `- 주요 업무 및 성과: ${el.description}`,
        ].join(`\n`);
      })
      .join(`\n\n`);
  }

  private async addSources(userId: string, input: Character.GetResponse['sources']): Promise<string> {
    const sources = await Promise.all(input.map((el) => this.formatSource(userId, el)));
    return sources.join(`\n\n`);
  }

  private async formatSource(userId: string, input: Character.GetResponse['sources'][0]): Promise<string> {
    const content = await this.handleSource(userId, input.type, input.url);
    return [`### ${input.subtype}`, '```md', `${content}`, '```'].join('\n');
  }

  private async handleSource(userId: string, type: Source['type'], url: Source['url']): Promise<string> {
    return type === 'link' ? this.handleNotion(userId, url) : url;
  }

  private async handleNotion(userId: string, url: Source['url']): Promise<string> {
    try {
      const id = NotionUtil.getPrivateNotionId(url);

      if (!id) {
        throw new NotFoundException();
      }
      const notion = await this.authService.getNotionAccessToken(userId);
      return this.getNotionToMd(notion.password, id);
    } catch (err) {
      console.error(err);
      return [url, `노션 콘텐츠 읽기에 실패 했습니다.`].join('\n');
    }
  }

  private async getNotionToMd(accessToken: string, id: string): Promise<string> {
    const notionClient = new Client({ auth: accessToken });
    const n2m = new NotionToMarkdown({ notionClient, config: { separateChildPage: false } });
    const mdblocks = await n2m.pageToMarkdown(id);
    const mdString = n2m.toMarkdownString(mdblocks);

    return mdString?.parent ?? '';
  }

  private async fetchUrl(url: Source['url']): Promise<string> {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(error);
      return `${url}\n 링크 콘텐츠 읽기에 실패했습니다.`;
    }
  }
}
