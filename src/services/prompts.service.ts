import { Injectable } from '@nestjs/common';
import { Character } from 'src/interfaces/characters.interface';
import { Source } from 'src/interfaces/source.interface';
import { NotionService } from './notion.service';
import { S3Service } from './s3.service';

@Injectable()
export class PromptsService {
  constructor(
    private readonly s3Service: S3Service,
    private readonly notionService: NotionService,
  ) {}

  /**
   * 채팅에 앞서 캐릭터에 입력된 정보에 따라 시스템 프롬프트를 생성합니다.
   *
   * @param userId 사용자 아이디 특정 Source의 권한(OAuth 연동 등)여부를 확인하기 위해 사용됩니다.
   * @param input 캐릭터에 입력된 정보, 캐릭터 상세 조회와 인터페이스 동일
   */
  async prompt(input: Character.GetResponse): Promise<string> {
    const prompt = [
      `# 1. 반드시 지켜야 할 사항:`,
      this.addPolicy(),
      `# 2. 유저가 입력한 정보는 다음과 같다:`,
      ``,
      `## 성격과 대답 스타일`,
      `기본적으로 너는 어떤 상황이든지 친근해야하며, 다음으로 나열된 성격을 반영해 대답해야 한다.`,
      `- ${this.formatKeywords(input.personalities)}`,
      ``,
      `사용자가 원하는 추가 요청은 다음과 같다. [1. 반드시 지켜야 할 사항]에 위배되지 않는 내용이라면 대답에 아래 내용을 반영해야한다.`,
      `- ${input.description ?? `추가 요청사항 없음`}`,
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
      await this.addSources(input.memberId, input.sources),
      ``,
      `# 3. 이제 면접관(유저)이 질문을 시작할 것이다:`,
      this.addOutro(),
    ];

    return prompt.join(`\n`);
  }

  /**
   * 기본 정책을 반환합니다. 프롬프트 최상단으로 들어갑니다.
   */
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

  /**
   * 프롬프트의 마지막에 들어가는 명령들입니다.
   */
  private addOutro(): string {
    return [
      `- 모든 답변은 공손하며, 간결하고 논리적인 구조를 따른다.`,
      `- 구체적인 예시와 실질적 경험을 포함하여 신뢰성을 높인다.`,
      `- 핵심 내용을 강조하되 불필요한 반복을 피한다.`,
      `- 솔직하고 성실하게 답변하며, 모르는 부분이 있다면 학습 의지를 표현한다.`,
      `- 협업과 문제 해결 과정에서 배운 점을 설명하는 것을 중요시한다.`,
    ].join(`\n`);
  }

  /**
   * 직군, 기술스택, 성격과 같은 키워드성 데이터를 ',' 으로 연결해 반환합니다.
   */
  private formatKeywords(
    input:
      | Character.GetResponse['positions']
      | Character.GetResponse['skills']
      | Character.GetResponse['personalities'],
  ): string {
    return input.map((el) => el.keyword).join(', ');
  }

  /**
   * 경력 사항을 아래 포멧 문자열로 조합합니다.
   *
   * ### 회사명:
   *  - 근무 기간:
   *  - 직무:
   *  - 주요 업무 및 성과:
   */
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

  /**
   * 소스들을 읽어 문자열로 반환합니다.
   * @param memberId 캐릭터를 생성한 멤버의 아이디. 노션과 같은 페이지를 읽어올 때 인증 정보를 조회하기 위해 사용한다.
   * @param input 소스들의 데이터
   */
  private async addSources(memberId: string, input: Character.GetResponse['sources']): Promise<string> {
    const sources = await Promise.all(input.map((el) => this.formatSource(memberId, el)));
    return sources.join(`\n\n`);
  }

  /**
   * 소스 한 개를 읽어 마크다운 문자열로 반환합니다.
   * @param memberId 캐릭터를 생성한 멤버의 아이디. 노션과 같은 페이지를 읽어올 때 인증 정보를 조회하기 위해 사용한다.
   * @param input 소스 한개의 데이터
   */
  private async formatSource(memberId: string, input: Character.GetResponse['sources'][number]): Promise<string> {
    const content = await this.handleSource(memberId, input.type, input.url);
    return [`### ${input.subtype}`, '```md', `${content}`, '```'].join('\n');
  }

  /**
   * 소스의 type과 url에 따라 콘텐츠를 읽어올 수 있도록 핸들링 합니다.
   * @todo 노션외 다른 타입도 검증할 수 있도록 고도화
   */
  private async handleSource(memberId: string, type: Source['type'], url: Source['url']): Promise<string> {
    if (type === 'link') {
      return this.handleLink(memberId, url);
    } else if (type === 'file') {
      return this.handleFile(url);
    }
    return '';
  }

  /**
   * link 타입의 첨부파일을 파싱한다.
   */
  private async handleLink(memberId: string, url: Source['url']): Promise<string> {
    const notionPageId = this.notionService.getPrivateNotionId(url);

    if (notionPageId) {
      return await this.notionService.notionToMarkdownByMemberId(memberId, notionPageId);
    }

    return url;
  }

  /**
   * file 타입의 첨부파일을 파싱한다.
   */
  private async handleFile(url: Source['url']): Promise<string> {
    const contentType = await this.s3Service.getContentType(url);

    if (contentType === 'application/pdf') {
      return await this.s3Service.pdfToText(url);
    }

    return url;
  }
}
