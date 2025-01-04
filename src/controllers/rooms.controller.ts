import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { UserGuard } from 'src/guards/user.guard';
import { Guard } from 'src/interfaces/guard.interface';
import { Room } from 'src/interfaces/rooms.interface';
import { RoomsService } from 'src/services/rooms.service';

@ApiTags('Room')
@Controller('rooms')
export class RoomsController {
  constructor(private readonly roomsService: RoomsService) {}

  /**
   * 채팅방을 생성한다.
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Post()
  async createRoom(@User() user: Guard.UserResponse, @core.TypedBody() body: Room.CreateRequest) {
    return this.roomsService.create(user.id, body);
  }

  /**
   * 채팅방을 조회한다.
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get(':id')
  async getRoom(@User() user: Guard.UserResponse, @core.TypedParam('id') id: Room['id']) {
    return this.roomsService.get(user.id, id);
  }
}
