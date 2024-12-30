import { Controller } from '@nestjs/common';
import { SourcesService } from 'src/services/sources.service';

@Controller('sources')
export class SourcesController {
  constructor(private readonly sourcesService: SourcesService) {}
}
