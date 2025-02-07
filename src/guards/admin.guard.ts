import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const accessToken = this.getBearerToken(request);
      const adminSecret = this.configService.get<string>('ADMIN_SECRET');

      if (!accessToken) {
        throw new UnauthorizedException();
      }

      return accessToken === adminSecret ? true : false;
    } catch (error) {
      console.error('User Guard Error:', error);
      throw new UnauthorizedException();
    }
  }

  private getBearerToken(request: any): string | null {
    let authHeader = request.headers['x-admin'];
    authHeader = authHeader ?? request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
}
