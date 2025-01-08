import { InternalServerErrorException } from '@nestjs/common';
import OpenAI from 'openai';
import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';
import { Chat } from 'src/interfaces/chats.interface';

export namespace OpenaiUtil {
  const apiKey = process.env.OPENAI_API_KEY;

  /**
   * type
   */
  export type ChatCompletionRequestType =
    | ChatCompletionSystemMessageParam
    | ChatCompletionUserMessageParam
    | ChatCompletionAssistantMessageParam;

  export type ContentType = string;

  /**
   * funtion
   */

  export function getContent(input: ChatCompletion): OpenaiUtil.ContentType | null {
    return input.choices.at(0)?.message.content ?? null;
  }

  /**
   * 채팅 기록을 바탕으로 질문에 대한 답을 생성한다.
   * @param histories 특정 채팅방에서 사용자와 캐릭터가 나눈 채팅기록.
   */
  export async function getAnswer(histories: Array<OpenaiUtil.ChatCompletionRequestType>): Promise<string> {
    const completion = await new OpenAI({
      apiKey: apiKey,
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

  export function mappingHistories(chats: Chat.GetAllResponse): Array<OpenaiUtil.ChatCompletionRequestType> {
    const histories = chats.map((el): OpenaiUtil.ChatCompletionRequestType => {
      const content = el.message;

      if (el.userId !== null) {
        return {
          role: 'user',
          content: content,
        };
      } else if (el.characterId !== null) {
        return {
          role: 'assistant',
          content: content,
        };
      } else {
        return {
          role: 'system',
          content: content,
        };
      }
    });

    return histories;
  }
}
