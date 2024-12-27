import { Module } from '@nestjs/common';
import { CharactersService } from 'src/services/characters.service';
import { CharactersController } from '../controllers/characters.controller';
import { PositionsModule } from './positions.module';

@Module({
  imports: [PositionsModule],
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
