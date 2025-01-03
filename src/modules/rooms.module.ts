import { Module } from '@nestjs/common';
import { RoomsController } from 'src/controllers/rooms.controller';
import { RoomsService } from 'src/services/rooms.service';

@Module({
  controllers: [RoomsController],
  providers: [RoomsService],
  exports: [RoomsService],
})
export class RoomsModule {}
