import { Module } from '@nestjs/common';
import { MembersController } from 'src/controllers/members.controller';
import { MembersService } from '../services/members.service';

@Module({
  imports: [],
  controllers: [MembersController],
  providers: [MembersService],
})
export class MembersModule {}
