import { Module } from '@nestjs/common';
import { FilesController } from 'src/controllers/files.controller';
import { S3Service } from '../services/s3.service';

@Module({
  controllers: [FilesController],
  providers: [S3Service],
  exports: [S3Service],
})
export class FileModule {}
