import { Module } from '@nestjs/common';
import { PersonalitiesController } from 'src/controllers/personalities.controller';
import { PersonalitiesService } from '../services/personalities.service';

@Module({
  controllers: [PersonalitiesController],
  providers: [PersonalitiesService],
})
export class PersonalitiesModule {}
