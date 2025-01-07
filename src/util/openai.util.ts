import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';
import { Chat } from 'src/interfaces/chats.interface';

export namespace OpenaiUtil {
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
