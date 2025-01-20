import { Module } from '@nestjs/common';
import { AdminController } from 'src/controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { CharactersModule } from './characters.module';
import { PersonalitiesModule } from './personalities.module';
import { RoomsModule } from './rooms.module';

@Module({
  imports: [PersonalitiesModule, CharactersModule, RoomsModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
