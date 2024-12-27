import { Controller } from '@nestjs/common';
import { SkillsService } from 'src/services/skills.service';

@Controller('skills')
export class SkillsController {
  constructor(private readonly skillsService: SkillsService) {}
}
