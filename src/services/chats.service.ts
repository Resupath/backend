import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Chat } from 'src/interfaces/chats.interface';
import { DateTimeUtil } from 'src/util/datetime.util';
import { OpenaiUtil } from 'src/util/openai.util';
import { OpenaiService } from './openai.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenaiService,
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
    await this.createUserChat(id, {
      userId: body.userId,
      message: body.message,
    });

    // 2. 채팅 기록 조회 및 매핑
    const histories = await this.getChatHistories(id);

    // 3. 응답 생성 (API 요청)
    const answer = await this.openaiService.getAnswer(histories);

    // 4. 응답 저장
    await this.createCharacterChat(id, {
      characterId: body.characterId,
      message: answer,
    });

    return answer;
  }

  /**
   * Room에 저장된 이전 대화 목록을 조회한다. 조회 결과를 Openai request 형태로 매핑한다.
   * 첫번째 질문이라면 system 프롬프트를 넣어준다.
   */
  private async getChatHistories(roomId: string): Promise<Array<OpenaiUtil.ChatCompletionRequestType>> {
    const chats = await this.getAll(roomId);

    if (chats.length === 1) {
      const prompt = await this.createSystemPrompt(roomId);
      chats.push(prompt);
    }

    /**
     * mapping
     */
    let histories = chats.map((el): OpenaiUtil.ChatCompletionRequestType => {
      const content = OpenaiUtil.createContents(el.message, el.createdAt);

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

  private async createSystemPrompt(roomId: string): Promise<Chat.GetResponse> {
    const message = ['여기에 프롬프트', '내용을 작성합니다.'].join('\n');

    const prompt = await this.createSystemChat(roomId, { message });

    return prompt;
  }

  async createUserChat(roomId: string, body: Pick<Chat.CreateRequst, 'userId' | 'message'>): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: body.userId,
      characterId: null,
      message: body.message,
    });
  }

  async createCharacterChat(
    roomId: string,
    body: Pick<Chat.CreateRequst, 'characterId' | 'message'>,
  ): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: null,
      characterId: body.characterId,
      message: body.message,
    });
  }

  async createSystemChat(roomId: string, body: Pick<Chat.CreateRequst, 'message'>): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: null,
      characterId: null,
      message: body.message,
    });
  }

  private async createChat(roomId: string, body: Chat.CreateRequst): Promise<Chat.GetResponse> {
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
}
