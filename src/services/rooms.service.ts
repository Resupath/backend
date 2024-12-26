import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import OpenAI from 'openai';
import { ChatCompletion } from 'openai/resources';
import { Chat } from 'src/interfaces/chats.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { OpenaiUtil } from 'src/util/openai.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class RoomsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async getAll(roomId: string): Promise<Chat.GetAllResponse> {
    const chats = await this.prisma.chat.findMany({
      select: {
        id: true,
        user_id: true,
        character_id: true,
        message: true,
        created_at: true,
      },
      where: { room_id: roomId },
    });

    /**
     * mapping
     */
    return chats.map((el): Chat.GetResponse => {
      return {
        id: el.id,
        userId: el.user_id,
        characterId: el.character_id,
        message: el.message,
        createdAt: el.created_at.toISOString(),
      };
    });
  }

  async create(id: string, body: Chat.CreateRequst) {
    // 1. 질문 저장
    await this.createChat(id, {
      userId: body.userId,
      characterId: null,
      message: body.message,
    });

    // 2. 채팅 기록 조회 및 매핑
    const histories = await this.getChatHistories(id);

    // 3. 응답 생성 (API 요청)
    const answer = await this.getAnswer(histories);

    // 4. 응답 저장
    await this.createChat(id, {
      userId: null,
      characterId: body.characterId,
      message: answer,
    });

    return answer;
  }

  private getContent(input: ChatCompletion): string | null {
    return input.choices.at(0)?.message.content ?? null;
  }

  private createContents(message: string, createdAt: string): string {
    return JSON.stringify({
      message: message,
      createdAt: createdAt,
    });
  }

  private async getAnswer(
    histories: Array<OpenaiUtil.CreateChatCompletionRequest>,
  ): Promise<string> {
    const completion = await new OpenAI({
      apiKey: this.configService.get('OPENAI_API_KEY'),
    }).chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [...histories],
    });

    const answer = this.getContent(completion);
    if (!answer) {
      throw new InternalServerErrorException();
    }

    return answer;
  }

  /**
   * Room에 저장된 이전 대화 목록을 조회한다. 조회 결과를 Openai request 형태로 매핑한다.
   * 첫번째 질문이라면 system 프롬프트를 넣어준다.
   */
  private async getChatHistories(
    roomId: string,
  ): Promise<Array<OpenaiUtil.CreateChatCompletionRequest>> {
    const chats = await this.getAll(roomId);

    if (chats.length === 1) {
      const prompt = await this.createSystemPrompt(roomId);
      chats.push(prompt);
    }

    /**
     * mapping
     */
    let histories = chats.map((el): OpenaiUtil.CreateChatCompletionRequest => {
      const content = this.createContents(el.message, el.createdAt);

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

  private async createChat(
    roomId: string,
    body: Chat.CreateRequst,
  ): Promise<Chat.GetResponse> {
    const date = DateTimeUtil.now();

    const chat = await this.prisma.chat.create({
      select: {
        id: true,
        user_id: true,
        character_id: true,
        message: true,
        created_at: true,
      },
      data: {
        id: randomUUID(),
        room_id: roomId,
        user_id: body.userId,
        character_id: body.characterId,
        message: body.message,
        created_at: date,
      },
    });

    /**
     * mapping
     */
    return {
      id: chat.id,
      userId: chat.user_id,
      characterId: chat.character_id,
      message: chat.message,
      createdAt: chat.created_at.toISOString(),
    };
  }

  private async createSystemPrompt(roomId: string): Promise<Chat.GetResponse> {
    const message = ['여기에 프롬프트', '내용을 작성합니다.'].join('\n');

    const prompt = await this.createChat(roomId, {
      userId: null,
      characterId: null,
      message,
    });

    return prompt;
  }
}
