import { Module } from '@nestjs/common';
import { ChatsController } from 'src/controllers/chats.controller';
import { ChatsService } from '../services/chats.service';
import { CharactersModule } from './characters.module';
import { RoomsModule } from './rooms.module';

@Module({
  imports: [RoomsModule, CharactersModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
