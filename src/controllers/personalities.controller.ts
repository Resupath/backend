import { Controller } from '@nestjs/common';
import { PersonalitiesService } from 'src/services/personalities.service';

@Controller('personalities')
export class PersonalitiesController {
  constructor(private readonly personalitiesService: PersonalitiesService) {}
}
