import { Module } from '@nestjs/common';
import { ChatsController } from 'src/controllers/chats.controller';
import { ChatsService } from '../services/chats.service';
import { CharactersModule } from './characters.module';
import { OpenaiModule } from './openai.module';
import { RoomsModule } from './rooms.module';

@Module({
  imports: [OpenaiModule, RoomsModule, CharactersModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
