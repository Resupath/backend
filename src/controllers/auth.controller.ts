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
    const user = await this.authService.createUser();
    return this.authService.createUserToken(user);
  }

  /**
   * AccessToken과 RefreshToken을 재발급한다.
   */
  @core.TypedRoute.Post('refresh')
  async refresh(@core.TypedBody() body: Auth.RefreshRequest): Promise<Auth.LoginResponse> {
    return await this.authService.memberRefresh(body.refreshToken);
  }

  /**
   * 클라이언트 요청에 따라 구글 로그인 url을 반환한다.
   */
  @core.TypedRoute.Get('google')
  async getGoogleLoginUrl(@core.TypedQuery() query: Auth.GetUrlRequest): Promise<string> {
    return await this.authService.getGoogleLoginUrl(query.redirectUri);
  }

  /**
   * 클라이언트에서 받은 코드를 이용해 구글 로그인 유저를 검증하고 jwt를 발급한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('google/callback')
  async getGoogleAuthorization(
    @User() user: Guard.UserResponse,
    @core.TypedQuery() query: Auth.LoginRequest,
  ): Promise<Auth.LoginResponse> {
    return this.authService.getGoogleAuthorization(user.id, query);
  }

  /**
   * 노션 Authorization url을 반환한다.
   */
  @core.TypedRoute.Get('notion')
  async getNotionAuthorizationUrl(@core.TypedQuery() query: Auth.GetUrlRequest): Promise<string> {
    return this.authService.getNotionLoginUrl(query.redirectUri);
  }

  /**
   * 노션 AccessToken을 발급 받아 저장한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('notion/callback')
  async getNotionAuthorization(
    @User() user: Guard.UserResponse,
    @core.TypedQuery() query: Auth.LoginRequest,
  ): Promise<void> {
    return this.authService.getNotionAuthorization(user.id, query);
  }

  /**
   * 노션 API 연동 여부를 확인한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('notion/verify')
  async notionVerify(@User() user: Guard.UserResponse): Promise<boolean> {
    try {
      await this.authService.getNotionAccessTokenByUserId(user.id);
      return true;
    } catch (err) {
      return false;
    }
  }
}
