import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class UserGuard implements CanActivate {
  constructor(
    private readonly configService: ConfigService,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    try {
      const request = context.switchToHttp().getRequest();
      const accessToken = this.getBearerToken(request);

      if (!accessToken) {
        throw new UnauthorizedException();
      }

      const { id } = this.jwtService.verify(accessToken, {
        secret: this.configService.get('JWT_SECRET_USER'),
      });

      const user = await this.prisma.user.findUnique({
        select: { id: true },
        where: { id },
      });

      request.user = user;

      return user ? true : false;
    } catch (error) {
      console.error('User Guard Error:', error);
      throw new UnauthorizedException();
    }
  }

  private getBearerToken(request: any): string | null {
    let authHeader = request.headers['x-user'];
    authHeader = authHeader ?? request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
}
