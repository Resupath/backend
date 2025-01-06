import { Module } from '@nestjs/common';
import { MembersController } from 'src/controllers/members.controller';
import { MembersService } from '../services/members.service';
import { CharactersModule } from './characters.module';

@Module({
  imports: [CharactersModule],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
