import core from '@nestia/core';
import { Controller } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { Character } from 'src/interfaces/characters.interface';
import { Chat } from 'src/interfaces/chats.interface';
import { Personality } from 'src/interfaces/personalities.interface';
import { Room } from 'src/interfaces/rooms.interface';
import { CharactersService } from 'src/services/characters.service';
import { ChatsService } from 'src/services/chats.service';
import { PersonalitiesService } from 'src/services/personalities.service';
import { RoomsService } from 'src/services/rooms.service';

@ApiTags('Admin')
@Controller('admin')
export class AdminController {
  constructor(
    private readonly personalitiesService: PersonalitiesService,
    private readonly charactersService: CharactersService,
    private readonly roomsService: RoomsService,
    private readonly chatsService: ChatsService,
  ) {}

  /**
   * 성격 데이터를 생성한다. 중복된 키워드는 한번만 저장된다.
   */
  @core.TypedRoute.Post('personalities/bulk')
  async createPersonalities(@core.TypedBody() body: Personality.CreateBulkRequest): Promise<void> {
    return this.personalitiesService.createBulk(body);
  }

  /**
   * 채팅방의 채팅 목록을 조회한다. 내용은 프롬프트를 포함한다.
   */
  @core.TypedRoute.Get('rooms/:roomId/chats')
  async getCharacterChats(@core.TypedParam('roomId') roomId: Room['id']): Promise<Chat.GetAllResponse> {
    return this.chatsService.getAllAdmin(roomId);
  }

  /**
   * 채팅방을 페이지네이션으로 조회한다. 이미 삭제된 채팅방을 포함한다.
   */
  @core.TypedRoute.Get('rooms')
  async getRooms(@core.TypedQuery() query: Room.GetByPageRequest): Promise<Room.GetByPageResponse> {
    return this.roomsService.getByPage(query, { deletedAt: true });
  }

  /**
   * 캐릭터에 생성된 채팅방을 페이지네이션으로 조회한다. 이미 삭제된 방을 포함한다.
   */
  @core.TypedRoute.Get('characters/:characterId/rooms')
  async getCharacterRooms(
    @core.TypedParam('characterId') characterId: string,
    @core.TypedQuery() query: Room.GetByPageRequest,
  ): Promise<Room.GetByPageResponse> {
    return this.roomsService.getByPage(query, { characterId: characterId, deletedAt: true });
  }

  /**
   * 캐릭터를 조회한다. 사용자가 삭제한 캐릭터도 조회된다.
   */
  @core.TypedRoute.Get('characters')
  async getCharacters(@core.TypedQuery() query: Character.GetByPageRequest): Promise<Character.GetByPageResponse> {
    return await this.charactersService.getBypage(query, { deletedAt: true });
  }
}
