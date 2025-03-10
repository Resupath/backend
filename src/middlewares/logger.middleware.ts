import { Injectable, NestMiddleware } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { NextFunction, Request, Response } from 'express';
import { IncomingHttpHeaders } from 'http';
import { Guard } from 'src/interfaces/guard.interface';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class LoggerMiddleware implements NestMiddleware {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    const { method, originalUrl: url, headers, body, params, query } = req;
    const requestedAt = new Date();
    const logId = randomUUID();
    const userId = this.getBearerTokenUserId(headers);

    // 로그 생성 (요청 시점)
    await this.prisma.log
      .create({
        data: {
          id: logId,
          user_id: userId ?? null,
          method,
          url,
          headers: JSON.stringify(headers),
          body: body ? JSON.stringify(body) : null,
          param: params ? JSON.stringify(params) : null,
          query: query ? JSON.stringify(query) : null,
          ttl: null,
          created_at: requestedAt,
        },
      })
      .catch(console.error);

    const originalSend = res.send;

    // send 메서드 오버라이드
    res.send = (responseBody: any): Response => {
      const statusCode = res.statusCode;
      const duration = Date.now() - requestedAt.getTime();

      try {
        // 응답 후 로그 업데이트
        this.prisma.log
          .update({
            data: {
              response: responseBody ?? null,
              ttl: duration,
              error: statusCode >= 400,
            },
            where: { id: logId },
          })
          .catch(console.error); // 에러가 발생해도 무시하고 진행
      } catch (error) {
        console.error('Error while updating log:', error);
      }

      // 응답 전송
      return originalSend.call(res, responseBody);
    };

    next();
  }

  /**
   * 헤더 x-user에서 id를 인증해 반환한다.
   * 토큰 정보가 없거나 verify에 실패한 경우에도 로직에 문제는 없기에 null 반환
   *
   * @param headers 요청 헤더
   */
  private getBearerTokenUserId(headers: IncomingHttpHeaders): string | null {
    const token = headers['x-user'] as string;
    if (token) {
      try {
        const secret = this.configService.get<string>('JWT_SECRET_USER');
        const decoded = this.jwtService.verify(token, { secret }) as Guard.UserResponse;

        const userId = decoded.id;
        return userId;
      } catch (error) {
        console.error(error);
        return null;
      }
    }
    return null;
  }
}
