import { Module } from '@nestjs/common';
import { SourcesController } from 'src/controllers/sources.controller';
import { SourcesService } from '../services/sources.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService],
})
export class SourcesModule {}
