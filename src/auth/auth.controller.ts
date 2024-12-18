import core, { TypedQuery } from '@nestia/core';
import { Controller } from '@nestjs/common';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /**
   * 클라이언트 요청에 따라 구글 로그인 url을 반환한다.
   */
  @core.TypedRoute.Get('google')
  async getGoogleLoginUrl() {
    return this.authService.getGoogleLoginUrl();
  }

  /**
   * 클라이언트에서 받은 코드를 이용해 유저를 검증하고 jwt를 발급한다.
   */
  @core.TypedRoute.Get('google/callback')
  async getGoogleAuthorization(@TypedQuery() input: { code: string }) {
    console.log(input.code);
    return this.authService.getGoogleAuthorization(input.code);
  }
}
