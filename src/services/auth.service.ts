import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Auth } from 'src/interfaces/auth.interface';
import { User } from 'src/interfaces/user.interface';
import { DateTimeUtil } from 'src/util/dateTime.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * userToken을 발급한다.
   */

  async getUserToken() {
    const user = await this.createUser();
    return this.createUserToken(user);
  }

  async createUser() {
    const date = DateTimeUtil.now();

    return await this.prisma.user.create({
      select: { id: true },
      data: { id: randomUUID(), created_at: date },
    });
  }

  /**
   * Refresh Token을 검증하고 인증 정보를 재발급한다.
   */
  async memberRefresh(refreshToken: string) {
    const payload = await this.verifyRefreshToken(refreshToken);
    return this.login(payload);
  }

  /**
   * 구글 로그인 페이지의 url을 반환한다.
   */
  async getGoogleLoginUrl() {
    const { clientId, redirectUri } = this.getGoogleClient();
    const scope = encodeURIComponent('profile email'); // 허용된 스코프는 프로필과 이메일이다.

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
  }

  /**
   * 구글 로그인 결과를 검증하고 jwt를 발급한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getGoogleAuthorization(code: string) {
    try {
      const { accessToken, refreshToken } =
        await this.getGoogleAccessToken(code);
      const { uid, email, name } = await this.getGoogleUserInfo(accessToken);

      const member = await this.findOrCreateMember({
        uid,
        email,
        name,
        accessToken,
        refreshToken,
        type: 'google',
      });

      return this.login(member);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException();
    }
  }

  async findOrCreateMember(authorization: Auth.CommonAuthorizationResponse) {
    const provider = await this.findProviderMember(authorization);
    return provider
      ? await this.updateProviderPassword(
          provider.id,
          authorization.refreshToken,
        )
      : await this.createMember(authorization);
  }

  async findProviderMember(authorization: Auth.CommonAuthorizationResponse) {
    const provider = await this.prisma.provider.findFirst({
      select: { id: true, member: { select: { id: true, name: true } } },
      where: { uid: authorization.uid, type: authorization.type },
    });

    return provider;
  }

  async updateProviderPassword(providerId: string, refreshToken: string) {
    const { member } = await this.prisma.provider.update({
      select: { member: { select: { id: true, name: true } } },
      data: { password: refreshToken },
      where: { id: providerId },
    });

    return member;
  }

  async createMember(authorization: Auth.CommonAuthorizationResponse) {
    const date = new Date().toISOString();
    const { member } = await this.prisma.provider.create({
      select: { member: { select: { id: true, name: true } } },
      data: {
        id: randomUUID(),
        uid: authorization.uid,
        password: authorization.refreshToken,
        type: authorization.type,
        created_at: date,
        member: {
          create: {
            id: randomUUID(),
            name: authorization.name,
            created_at: date,
          },
        },
      },
    });

    return member;
  }

  private async verifyRefreshToken(
    refreshToken: string,
  ): Promise<{ id: string; name: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET_MEMBER'),
      });
      return payload as { id: string; name: string };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException();
    }
  }

  private login(member: { id: string; name: string }) {
    const payload: { id: string; name: string } = {
      id: member.id,
      name: member.name,
    };

    const accessToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_SECRET_MEMBER'),
      expiresIn: this.configService.get('JWT_EXPIRATION_TIME'),
    });

    const refreshToken = this.jwtService.sign(payload, {
      secret: this.configService.get('JWT_REFRESH_SECRET_MEMBER'),
      expiresIn: this.configService.get('JWT_REFRESH_EXPIRATION_TIME'),
    });

    return { ...member, accessToken, refreshToken };
  }

  private createUserToken(user: Pick<User, 'id'>): Auth.UserToken {
    const userToken = this.jwtService.sign(user, {
      secret: this.configService.get('JWT_SECRET_USER'),
      expiresIn: this.configService.get('JWT_EXPIRATION_TIME_USER'),
    });

    return { userToken };
  }

  private async getGoogleAccessToken(code: string) {
    const { clientId, clientSecret, redirectUri } = this.getGoogleClient();

    const response = await axios.post<{
      access_token: string;
      refresh_token: string;
      token_type: 'Bearer';
      scope: string;
      expires_in: number;
    }>(`https://oauth2.googleapis.com/token`, {
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }

  private async getGoogleUserInfo(accessToken: string) {
    const response = await axios.get<{
      id: string;
      email: string;
      verified_email: boolean;
      name: string;
      given_name: string;
      family_name: string;
      picture: string;
    }>('https://www.googleapis.com/oauth2/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return {
      uid: response.data.id,
      email: response.data.email,
      name: response.data.name,
    };
  }

  private getGoogleClient() {
    return {
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    };
  }
}
