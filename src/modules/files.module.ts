import { Module } from '@nestjs/common';
import { FilesController } from 'src/controllers/files.controller';
import { S3Service } from '../services/files.service';

@Module({
  controllers: [FilesController],
  providers: [S3Service],
})
export class FileModule {}
