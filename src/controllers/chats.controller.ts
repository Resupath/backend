import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { UserGuard } from 'src/guards/user.guard';
import { Chat } from 'src/interfaces/chats.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { Room } from 'src/interfaces/rooms.interface';
import { ChatsService } from 'src/services/chats.service';

@ApiTags('Chat')
@Controller('chats')
export class ChatsController {
  constructor(private readonly chatsService: ChatsService) {}

  /**
   * 채팅방에 입력된 전체 채팅 기록을 조회한다.
   */
  @core.TypedRoute.Get('/:roomId')
  async getAllChat(@core.TypedParam('roomId') roomId: Room['id']) {
    const chats = await this.chatsService.getAll(roomId);
    return chats.filter((el) => el.userId || el.characterId);
  }

  /**
   * 채팅방에 입력된 전체 채팅 기록을 바탕으로 캐릭터의 응답을 생성한다.
   *
   *  @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Post('/:roomId')
  async createChat(
    @User() user: Guard.UserResponse,
    @core.TypedParam('roomId') roomId: Room['id'],
    @core.TypedBody() body: Chat.CreateRequst,
  ) {
    return await this.chatsService.chat(user.id, roomId, body);
  }
}
