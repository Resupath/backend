import { Module } from '@nestjs/common';
import { ExperiencesService } from '../services/experiences.service';
import { ExperiencesController } from '../controllers/experiences.controller';

@Module({
  controllers: [ExperiencesController],
  providers: [ExperiencesService],
  exports: [ExperiencesService],
})
export class ExperiencesModule {}
