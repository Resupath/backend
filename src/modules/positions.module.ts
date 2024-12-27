import { Module } from '@nestjs/common';
import { PositionsService } from '../services/positions.service';
import { PositionsController } from 'src/controllers/positions.controller';

@Module({
  controllers: [PositionsController],
  providers: [PositionsService],
  exports: [PositionsService],
})
export class PositionsModule {}
