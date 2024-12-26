import { Module } from '@nestjs/common';
import { ChatsController } from 'src/controllers/chats.controller';
import { ChatsService } from '../services/chats.service';
import { OpenaiModule } from './openai.module';

@Module({
  imports: [OpenaiModule],
  controllers: [ChatsController],
  providers: [ChatsService],
})
export class ChatsModule {}
