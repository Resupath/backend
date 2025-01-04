import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Chat } from 'src/interfaces/chats.interface';
import { DateTimeUtil } from 'src/util/datetime.util';
import { OpenaiUtil } from 'src/util/openai.util';
import { PromptUtil } from 'src/util/prompt.util';
import { CharactersService } from './characters.service';
import { OpenaiService } from './openai.service';
import { PrismaService } from './prisma.service';
import { RoomsService } from './rooms.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly openaiService: OpenaiService,
    private readonly roomsService: RoomsService,
    private readonly charactersService: CharactersService,
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
      orderBy: { created_at: 'asc' },
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

  async chat(userId: string, roomId: string, body: Chat.CreateRequst) {
    const room = await this.roomsService.get(userId, roomId);

    // 1. 질문 저장
    await this.createUserChat(roomId, {
      userId,
      message: body.message,
    });

    // 2. 채팅 기록 조회 및 매핑
    const chats = await this.getAll(roomId);

    if (chats.length === 1) {
      const prompt = await this.createSystemPrompt(room.character.id, roomId);
      chats.push(prompt);
    }
    const histories = this.mappingHistories(chats);

    // 3. 응답 생성 (API 요청)
    const answer = await this.openaiService.getAnswer(histories);

    // 4. 응답 저장
    await this.createCharacterChat(roomId, {
      characterId: body.characterId,
      message: answer,
    });

    return answer;
  }

  async createUserChat(roomId: string, body: Pick<Chat, 'userId' | 'message'>): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: body.userId,
      characterId: null,
      message: body.message,
    });
  }

  async createCharacterChat(roomId: string, body: Pick<Chat, 'characterId' | 'message'>): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: null,
      characterId: body.characterId,
      message: body.message,
    });
  }

  async createSystemChat(roomId: string, body: Pick<Chat, 'message'>): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: null,
      characterId: null,
      message: body.message,
    });
  }

  private async createSystemPrompt(characterId: string, roomId: string): Promise<Chat.GetResponse> {
    const character = await this.charactersService.get(characterId);
    const prompt = PromptUtil.prompt(character);

    const chat = await this.createSystemChat(roomId, { message: prompt });
    return chat;
  }

  private async createChat(
    roomId: string,
    body: Pick<Chat, 'userId' | 'characterId' | 'message'>,
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

  private mappingHistories(chats: Chat.GetAllResponse): Array<OpenaiUtil.ChatCompletionRequestType> {
    const histories = chats.map((el): OpenaiUtil.ChatCompletionRequestType => {
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
}
