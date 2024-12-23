import { Controller } from '@nestjs/common';
import { ExperiencesService } from '../services/experiences.service';

@Controller('experiences')
export class ExperiencesController {
  constructor(private readonly experiencesService: ExperiencesService) {}
}
