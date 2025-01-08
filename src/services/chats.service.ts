import { Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { Chat } from 'src/interfaces/chats.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { OpenaiUtil } from 'src/util/openai.util';
import { PromptUtil } from 'src/util/prompt.util';
import { CharactersService } from './characters.service';
import { PrismaService } from './prisma.service';
import { RoomsService } from './rooms.service';

@Injectable()
export class ChatsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly roomsService: RoomsService,
    private readonly charactersService: CharactersService,
  ) {}

  async getAll(userId: string, roomId: string): Promise<Chat.GetAllResponse> {
    const { id, ...rest } = await this.roomsService.get(userId, roomId);

    return this.findMany(id);
  }

  async chat(userId: string, roomId: string, body: Chat.CreateRequst) {
    const { id, user, character } = await this.roomsService.get(userId, roomId);

    // 1. 채팅 기록 조회
    const chats = await this.findMany(id);

    // 1-1. 채팅 기록이 없다면 프롬프트 삽입
    if (!chats.length) {
      const prompt = await this.createSystemPrompt(character.id, id);
      chats.push(prompt);
    }

    // 2. 질문 저장
    const newChat = await this.createUserChat(roomId, {
      userId: user.id,
      message: body.message,
    });
    chats.push(newChat);

    // 3. 히스토리 가공
    const histories = OpenaiUtil.mappingHistories(chats);

    // 3. 응답 생성 (API 요청)
    const answer = await OpenaiUtil.getAnswer(histories);

    // 4. 응답 저장
    await this.createCharacterChat(roomId, {
      characterId: character.id,
      message: answer,
    });

    return answer;
  }

  private async findMany(roomId: string): Promise<Chat.GetAllResponse> {
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

  private async createUserChat(roomId: string, body: Pick<Chat, 'userId' | 'message'>): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: body.userId,
      characterId: null,
      message: body.message,
    });
  }

  private async createCharacterChat(
    roomId: string,
    body: Pick<Chat, 'characterId' | 'message'>,
  ): Promise<Chat.GetResponse> {
    return this.createChat(roomId, {
      userId: null,
      characterId: body.characterId,
      message: body.message,
    });
  }

  private async createSystemChat(roomId: string, body: Pick<Chat, 'message'>): Promise<Chat.GetResponse> {
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
}
