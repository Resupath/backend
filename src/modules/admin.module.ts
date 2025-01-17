import { Module } from '@nestjs/common';
import { AdminController } from 'src/controllers/admin.controller';
import { AdminService } from '../services/admin.service';
import { PersonalitiesModule } from './personalities.module';

@Module({
  imports: [PersonalitiesModule],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}
