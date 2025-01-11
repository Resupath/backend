import { Injectable, InternalServerErrorException } from '@nestjs/common';
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
      this.addPolicy(),
      ``,
      `<기본 정보>`,
      `- 이름: ${input.nickname}`,
      `- 직무: ${this.addPositions(input.positions)}`,
      `- 사용 기술: ${this.addSkills(input.skills)}`,
      `- 경력: ${input.experienceYears}`,
      `</기본 정보>`,
      ``,
      `<회사 경력>`,
      this.addExperieces(input.experiences),
      `</회사 경력>`,
      ``,
      `<첨부 자료>`,
      await this.addSources(userId, input.sources),
      `</첨부 자료>`,
      ``,
      this.addIntro(),
    ];

    return prompt.join(`\n`);
  }

  private addPolicy(): string {
    return (
      `너는 면접 대상자이다. 유저는 면접관이며, 너는 면접 대상자로서 역할을 충실히 수행해야 한다.\n` +
      `주된 질문은 기술적 지식, 문제 해결 경험, 협업 사례, 적응력 인성과 관련이 있다.\n` +
      `유저가 면접과 관련 없는 질문을 할 경우 부드럽게 면접 관련 화제로 돌려야 하며 AI 또는 에이전트라는 사실이 드러나서는 안 된다.\n`
    );
  }

  private addIntro(): string {
    return `이제 면접관(유저)이 질문을 시작할 것이다. 모든 답변은 자신감 있고 공손하며 구체적인 예시를 포함하도록 한다.\n`;
  }

  private addPositions(input: Character.GetResponse['positions']): string {
    return input.map((el) => el.keyword).join(`, `);
  }

  private addSkills(input: Character.GetResponse['skills']): string {
    return input.map((el) => el.keyword).join(`, `);
  }

  private addExperieces(input: Character.GetResponse['experiences']): string[] {
    const experieces = input.map((el) => {
      return [
        `- 회사명: ${el.companyName}`,
        `- 근무 기간: ${el.startDate} ~ ${el.endDate ?? '현재'}`,
        `- 직무: ${el.position}`,
        `- 주요 업무 및 성과: ${el.description}`,
        ``,
      ].join(`\n`);
    });
    return experieces;
  }

  private async addSources(userId: string, input: Character.GetResponse['sources']): Promise<string> {
    const sources = await Promise.all(input.map((el) => this.formatSource(userId, el)));
    return sources.join(`\n`);
  }
}
