import { Module } from '@nestjs/common';
import { CharactersService } from 'src/services/characters.service';
import { CharactersController } from '../controllers/characters.controller';
import { ExperiencesModule } from './experiences.module';
import { PersonalitiesModule } from './personalities.module';
import { PositionsModule } from './positions.module';
import { SkillsModule } from './skills.module';
import { SourcesModule } from './sources.module';

@Module({
  imports: [PersonalitiesModule, ExperiencesModule, PositionsModule, SkillsModule, SourcesModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
