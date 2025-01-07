import { InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { Character } from 'src/interfaces/characters.interface';

export namespace PromptUtil {
  export const prompt = (input: Character.GetResponse): string => {
    return [
      addPolicy(),
      ``,
      `<기본 정보>`,
      `- 이름: ${input.nickname}`,
      `- 직무: ${addPositions(input)}`,
      `- 사용 기술: ${addSkills(input)}`,
      `- 경력: ${input.experienceYears}`,
      `</기본 정보>`,
      ``,
      `<회사 경력>`,
      addExperieces(input),
      `</회사 경력>`,
      ``,
      `<첨부 자료>`,
      addSources(input),
      `</첨부 자료>`,
      ``,
      addIntro(),
    ].join(`\n`);
  };

  export const addPolicy = (): string => {
    return (
      `너는 면접 대상자이다. 유저는 면접관이며, 너는 면접 대상자로서 역할을 충실히 수행해야 한다.\n` +
      `주된 질문은 기술적 지식, 문제 해결 경험, 협업 사례, 적응력 인성과 관련이 있다.\n` +
      `유저가 면접과 관련 없는 질문을 할 경우 부드럽게 면접 관련 화제로 돌려야 하며 AI 또는 에이전트라는 사실이 드러나서는 안 된다.\n`
    );
  };

  export const addIntro = (): string => {
    return `이제 면접관(유저)이 질문을 시작할 것이다. 모든 답변은 자신감 있고 공손하며 구체적인 예시를 포함하도록 한다.\n`;
  };

  export const addPositions = (input: Character.GetResponse): string => {
    return input.positions.map((el) => el.keyword).join(`, `);
  };

  export const addSkills = (input: Character.GetResponse): string => {
    return input.skills.map((el) => el.keyword).join(`, `);
  };

  export const addExperieces = (input: Character.GetResponse): string[] => {
    const experieces = input.experiences.map((el) => {
      return [
        `- 회사명: ${el.companyName}`,
        `- 근무 기간: ${el.startDate} ~ ${el.endDate ?? '현재'}`,
        `- 직무: ${el.position}`,
        `- 주요 업무 및 성과: ${el.description}`,
        ``,
      ].join(`\n`);
    });
    return experieces;
  };

  export const addSources = (input: Character.GetResponse): string[] => {
    const sources = input.sources.map((el) => {
      return [`- ${el.subtype}: `, `${el.type === 'file' ? el.url : readLink(el.url)}`].join(`\n`);
    });

    return sources;
  };

  export const readLink = async (url: string): Promise<string> => {
    try {
      const response = await axios.get(url);
      return response.data;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException();
    }
  };
}
