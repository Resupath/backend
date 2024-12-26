import {
  ChatCompletion,
  ChatCompletionAssistantMessageParam,
  ChatCompletionSystemMessageParam,
  ChatCompletionUserMessageParam,
} from 'openai/resources';

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
  export function getContent(
    input: ChatCompletion,
  ): OpenaiUtil.ContentType | null {
    return input.choices.at(0)?.message.content ?? null;
  }

  export function createContents(
    message: string,
    createdAt: string,
  ): OpenaiUtil.ContentType {
    return JSON.stringify({
      message: message,
      createdAt: createdAt,
    });
  }
}
