import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/services/prisma.service';

@Injectable()
export class MemberGuard implements CanActivate {
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
        secret: this.configService.get('JWT_SECRET_MEMBER'),
      });

      const member = await this.prisma.member.findUnique({
        select: { id: true },
        where: { id },
      });

      request.user = member;

      return member ? true : false;
    } catch (error) {
      console.error('Member Guard Error:', error);
      throw new UnauthorizedException();
    }
  }

  private getBearerToken(request: any): string | null {
    let authHeader = request.headers['X-Member'];
    authHeader = authHeader ?? request.headers['authorization'];

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }
    return authHeader.split(' ')[1];
  }
}
