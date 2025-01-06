import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
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
