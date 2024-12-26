import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { Chat } from 'src/interfaces/chats.interface';
import { Room } from 'src/interfaces/rooms.interface';
import { ChatsService } from 'src/services/chats.service';

@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * 채팅방에 입력된 전체 채팅 기록을 조회한다.
   */
  @core.TypedRoute.Get('/:roomId')
  async getAllChat(@core.TypedParam('roomId') roomId: Room['id']) {
    return await this.chatsService.getAll(roomId);
  }

  /**
   * 채팅방에 입력된 전체 채팅 기록을 바탕으로 캐릭터의 응답을 생성한다.
   */
  @core.TypedRoute.Post('/:roomId')
  async createChat(
    @core.TypedParam('roomId') roomId: Room['id'],
    @core.TypedBody() body: Chat.CreateRequst,
  ) {
    return await this.chatsService.create(roomId, body);
  }
}
