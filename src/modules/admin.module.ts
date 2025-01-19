import { Module } from '@nestjs/common';
import { AdminController } from 'src/controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { CharactersModule } from './characters.module';
import { PersonalitiesModule } from './personalities.module';

@Module({
  imports: [PersonalitiesModule, CharactersModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
