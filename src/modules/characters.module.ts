import { Module } from '@nestjs/common';
import { CharactersService } from 'src/services/characters.service';
import { CharactersController } from '../controllers/characters.controller';
import { PositionsModule } from './positions.module';
import { SkillsModule } from './skills.module';
import { ExperiencesModule } from './experiences.module';

@Module({
  imports: [ExperiencesModule, PositionsModule, SkillsModule],
  controllers: [CharactersController],
  providers: [CharactersService],
  exports: [CharactersService],
})
export class CharactersModule {}
