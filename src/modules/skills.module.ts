import { Module } from '@nestjs/common';
import { SkillsService } from '../services/skills.service';
import { SkillsController } from 'src/controllers/skills.controller';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService],
})
export class SkillsModule {}
