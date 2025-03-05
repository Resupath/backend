import core from '@nestia/core';
import { Controller, UseGuards } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { User } from 'src/decorators/user.decorator';
import { UserGuard } from 'src/guards/user.guard';
import { Auth } from 'src/interfaces/auth.interface';
import { Common } from 'src/interfaces/common.interface';
import { Guard } from 'src/interfaces/guard.interface';
import { Provider } from 'src/interfaces/provider.interface';
import { AuthService } from 'src/services/auth.service';
import { OAuthService } from 'src/services/oauth.service';
import { NotionUtil } from 'src/util/notion.util';

@ApiTags('Auth')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly oauthService: OAuthService,
  ) {}

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
   * 클라이언트에서 받은 코드를 이용해 구글 로그인 유저를 검증하고 jwt를 발급한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('/:provider/link')
  async getAuthorizationLink(
    @User() user: Guard.UserResponse,
    @core.TypedParam('provider') provider: Provider['type'],
    @core.TypedQuery() query: Auth.LoginRequest,
  ): Promise<Common.Response> {
    await this.authService.getAuthorizationLink(provider, user.id, query);
    return { message: `${provider} 연동이 완료되었습니다.` };
  }

  /**
   * 클라이언트에서 받은 코드를 이용해 구글 로그인 유저를 검증하고 jwt를 발급한다.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('/:provider/callback')
  async getGoogleAuthorization(
    @User() user: Guard.UserResponse,
    @core.TypedParam('provider') provider: Provider['type'],
    @core.TypedQuery() query: Auth.LoginRequest,
  ): Promise<Auth.LoginResponse> {
    return this.authService.getAuthorization(provider, user.id, query);
  }

  /**
   * 클라이언트 요청에 따라 구글 로그인 url을 반환한다.
   */
  @core.TypedRoute.Get('/:provider')
  async getGoogleLoginUrl(
    @core.TypedParam('provider') provider: Provider['type'],
    @core.TypedQuery() query: Auth.GetUrlRequest,
  ): Promise<string> {
    return await this.authService.getLoginUrl(provider, query.redirectUri);
  }

  /**
   * 노션 API 연동 여부를 확인 후 연동 페이지 정보를 반환한다. 연동되지 않았거나, 연동된 페이지가 없다면 null을 반환.
   *
   * @security x-user bearer
   */
  @UseGuards(UserGuard)
  @core.TypedRoute.Get('notion/verify')
  async notionVerify(@User() user: Guard.UserResponse): Promise<Array<NotionUtil.VerifyPageResponse> | null> {
    try {
      const { password } = await this.authService.getNotionAccessTokenByUserId(user.id);
      return await this.oauthService.getNotionAccessPages(password);
    } catch (err) {
      return null;
    }
  }
}
