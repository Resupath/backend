import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { BadRequestException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { randomUUID } from 'crypto';
import pdfParse from 'pdf-parse';
import { Files } from 'src/interfaces/files.interface';
import { Member } from 'src/interfaces/member.interface';

@Injectable()
export class S3Service {
  private s3: S3Client;

  constructor(private readonly configService: ConfigService) {
    this.s3 = new S3Client({
      region: this.getRegion(),
      credentials: {
        accessKeyId: this.configService.get<string>('AWS_ACCESS_KEY_ID') as string,
        secretAccessKey: this.configService.get<string>('AWS_SECRET_ACCESS_KEY') as string,
      },
    });
  }

  /**
   * 파일 업로드 후 s3 url 반환
   */
  async uploadFile(memberId: string, body: Files.CreateRequest): Promise<string> {
    const { file } = body;
    const MAX_SIZE = 10 * 1024 * 1024; // 10MB

    if (file.size > MAX_SIZE) {
      throw new BadRequestException('파일 크기가 10MB를 초과했습니다.');
    }

    const bucketName = this.getBucket();
    const regionName = this.getRegion();
    const key = this.createKey(memberId);
    const buffer = await this.fileToBuffer(file);

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: buffer,
      ContentType: file.type,
    });

    await this.s3.send(command);

    return `https://${bucketName}.s3.${regionName}.amazonaws.com/${key}`;
  }

  /**
   * 다운로드 가능한 Pre-signed URL 반환
   */
  async createDownloadUrl(key: string): Promise<Files.PresignedResponse> {
    const command = new GetObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { url };
  }

  /**
   * 업로드 가능한 Pre-signed URL 반환
   */
  async createUploadUrl(memberId: Member['id']): Promise<Files.PresignedResponse> {
    const key = `${memberId}/${randomUUID()}`;

    const command = new PutObjectCommand({
      Bucket: this.getBucket(),
      Key: key,
    });

    const url = await getSignedUrl(this.s3, command, { expiresIn: 3600 });
    return { url };
  }

  /**
   * 특정 리소스의 content-type을 읽어온다.
   */
  async getContentType(url: string) {
    try {
      const response = await axios.head(url);
      const contentType:
        | 'application/pdf'
        | 'image/jpeg'
        | 'image/png'
        | 'image/gif'
        | 'image/svg+xml'
        | 'image/webp'
        | 'video/mp4'
        | 'audio/mpeg'
        | 'audio/wav'
        | 'text/plain'
        | 'application/json'
        | 'text/csv'
        | 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' // XLSX
        | 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' // DOCX
        | 'application/zip' = response.headers['content-type'];

      return contentType ?? null;
    } catch (error) {
      throw new NotFoundException('content-type 확인 실패. url:', url);
    }
  }

  /**
   * pdf를 text로 변환한다.
   */
  async pdfToText(pdfUrl: string) {
    try {
      const response = await axios.get(pdfUrl, { responseType: 'arraybuffer' });
      const data = await pdfParse(response.data);

      return data.text;
    } catch (error) {
      console.error(error);
      throw new InternalServerErrorException(`pdf 텍스트 변환 실패.`);
    }
  }

  private async fileToBuffer(file: File): Promise<Buffer<ArrayBufferLike>> {
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    return buffer;
  }

  private createKey(userId: string): string {
    return `${userId}/${randomUUID()}`;
  }

  private getBucket(): string {
    return this.configService.get<string>('AWS_BUCKET_NAME') as string;
  }

  private getRegion(): string {
    return this.configService.get<string>('AWS_REGION') as string;
  }
}
