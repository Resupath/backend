import { Module } from '@nestjs/common';
import { SkillsController } from 'src/controllers/skills.controller';
import { SkillsService } from '../services/skills.service';

@Module({
  controllers: [SkillsController],
  providers: [SkillsService],
  exports: [SkillsService],
})
export class SkillsModule {}
