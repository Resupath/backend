import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import Multer from 'multer';
import { Member } from 'src/decorators/member.decorator';
import { User } from 'src/decorators/user.decorator';
import { MemberGuard } from 'src/guards/member.guard';
import { UserGuard } from 'src/guards/user.guard';
import { Files } from 'src/interfaces/files.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { S3Service } from 'src/services/files.service';

@ApiTags('File')
@Controller('files')
export class FilesController {
  constructor(private readonly s3Service: S3Service) {}

  /**
   * 파일을 업로드한 뒤 S3 파일 키를 반환합니다.
   */
  @UseGuards(MemberGuard)
  @core.TypedRoute.Post('upload')
  async UploadFile(
    @Member() member: Guard.UserResponse,
    @core.TypedFormData.Body(() => Multer()) body: Files.CreateRequest,
  ) {
    return await this.s3Service.uploadFile(member.id, body);
  }
}
