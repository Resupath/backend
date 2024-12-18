import core, { TypedQuery } from '@nestia/core';
import { Controller } from '@nestjs/common';
import {
  LoginRequestInterface,
  LoginResponseInterface,
} from 'src/interfaces/auth.interfaces';
import { AuthService } from 'src/services/auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @core.TypedRoute.Get('google/callback')
  async getGoogleAuthorization(
    @TypedQuery() query: LoginRequestInterface,
  ): Promise<LoginResponseInterface> {
    return this.authService.getGoogleAuthorization(query.code);
  }
}
