import { Module } from '@nestjs/common';
import { CharactersService } from 'src/services/characters.service';
import { CharactersController } from '../controllers/characters.controller';

@Module({
  controllers: [CharactersController],
  providers: [CharactersService],
})
export class CharactersModule {}
