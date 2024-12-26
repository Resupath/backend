import core from '@nestia/core';
import { Controller } from '@nestjs/common';
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
}
