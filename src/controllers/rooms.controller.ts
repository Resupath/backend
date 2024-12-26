import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { Chat } from 'src/interfaces/chats.interface';
import { RoomsService } from 'src/services/rooms.service';
import { tags } from 'typia';

@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * 채팅방에 입력된 전체 채팅 기록을 조회한다.
   */
  @core.TypedRoute.Get('/:id')
  async getAllChat(@core.TypedParam('id') id: string & tags.Format<'uuid'>) {
    return await this.roomsService.getAll(id);
  }

  /**
   * 채팅방에 입력된 전체 채팅 기록을 바탕으로 캐릭터의 응답을 생성한다.
   */
  @core.TypedRoute.Post('/:id')
  async createChat(
    @core.TypedParam('id') id: string & tags.Format<'uuid'>,
    @core.TypedBody() body: Chat.CreateRequst,
  ) {
    return await this.roomsService.create(id, body);
  }
}
