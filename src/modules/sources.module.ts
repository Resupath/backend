import { Module } from '@nestjs/common';
import { SourcesController } from 'src/controllers/sources.controller';
import { NotionService } from 'src/services/notion.service';
import { PdfService } from 'src/services/pdf.service';
import { SourcesService } from '../services/sources.service';

@Module({
  controllers: [SourcesController],
  providers: [SourcesService, NotionService, PdfService],
  exports: [SourcesService, NotionService],
})
export class SourcesModule {}
