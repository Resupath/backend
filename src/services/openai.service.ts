import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import { OpenaiUtil } from 'src/util/openai.util';

@Injectable()
export class OpenaiService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 채팅 기록을 바탕으로 질문에 대한 답을 생성한다.
   * @param histories 특정 채팅방에서 사용자와 캐릭터가 나눈 채팅기록.
   */
  async getAnswer(
    histories: Array<OpenaiUtil.ChatCompletionRequestType>,
  ): Promise<string> {
    const completion = await new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    }).chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [...histories],
    });

    const answer = OpenaiUtil.getContent(completion);

    if (!answer) {
      throw new InternalServerErrorException();
    }

    return answer;
  }
}
