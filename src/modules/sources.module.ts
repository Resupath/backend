import { Module } from '@nestjs/common';
import { SourcesController } from 'src/controllers/sources.controller';
import { NotionService } from 'src/services/notion.service';
import { SourcesService } from '../services/sources.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, NotionService],
  exports: [NotionService],
})
export class SourcesModule {}
