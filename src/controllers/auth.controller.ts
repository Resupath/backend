import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { UserGuard } from 'src/guards/user.guard';
import { Auth } from 'src/interfaces/auth.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { AuthService } from 'src/services/auth.service';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * user를 생성하고 토큰을 발급한다.
   */
  @core.TypedRoute.Get('user')
  async createUser(): Promise<Auth.UserToken> {
    return await this.authService.getUserToken();
  }

  /**
   * AccessToken과 RefreshToken을 재발급 한다.
   */
  @core.TypedRoute.Post('refresh')
  async refresh(
    @core.TypedBody() body: Auth.RefreshRequest,
  ): Promise<Auth.LoginResponse> {
    return await this.authService.memberRefresh(body.refreshToken);
  }

  /**
   * 클라이언트 요청에 따라 구글 로그인 url을 반환한다.
   */
  @core.TypedRoute.Get('google')
  async getGoogleLoginUrl(): Promise<string> {
    return await this.authService.getGoogleLoginUrl();
  }

  /**
   * 클라이언트에서 받은 코드를 이용해 유저를 검증하고 jwt를 발급한다.
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('google/callback')
  async getGoogleAuthorization(
    @User() user: Guard.UserResponse,
    @core.TypedQuery() query: Auth.LoginRequest,
  ): Promise<Auth.LoginResponse> {
    return this.authService.getGoogleAuthorization(user.id, query.code);
  }
}
