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
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Post()
  async createRoom(
    @User() user: Guard.UserResponse,
    @core.TypedBody() body: Room.CreateRequest,
  ): Promise<Room.CreateResponse> {
    return this.roomsService.create(user.id, body);
  }

  /**
   * user의 채팅방 목록을 전체 조회한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('')
  async getRooms(@User() user: Guard.UserResponse): Promise<Array<Room.GetResponse>> {
    return this.roomsService.getAll(user.id);
  }

  /**
   * user의 채팅방을 상세 조회한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get(':id')
  async getRoom(@User() user: Guard.UserResponse, @core.TypedParam('id') id: Room['id']): Promise<Room.GetResponse> {
    return this.roomsService.get(user.id, id);
  }
}
