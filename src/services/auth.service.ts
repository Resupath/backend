import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { CommonAuthorizationResponseInterface } from '../interfaces/auth.interfaces';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 구글 로그인 페이지의 url을 반환한다.
   */
  async getGoogleLoginUrl() {
    const { clientId, redirectUri } = this.getGoogleClient();
    const scope = encodeURIComponent('profile email'); // 허용된 스코프는 프로필과 이메일이다.

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${clientId}&redirect_uri=${redirectUri}&scope=${scope}&response_type=code&access_type=offline`;
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

  async findOrCreateMember(user: CommonAuthorizationResponseInterface) {
    const member = await this.findMember(user);
    return member ?? (await this.createMember(user));
  }

  async findMember(user: CommonAuthorizationResponseInterface) {
    const provider = await this.prisma.provider.findFirst({
      select: { id: true, member: { select: { id: true, name: true } } },
      where: { uid: user.uid, type: user.type },
    });

    return provider?.member;
  }

  async createMember(user: CommonAuthorizationResponseInterface) {
    const date = new Date();
    const provider = await this.prisma.provider.create({
      select: { id: true, member: { select: { id: true, name: true } } },
      data: {
        id: uuidv4(),
        uid: user.uid,
        password: user.refreshToken,
        type: user.type,
        created_at: date,
        member: { create: { id: uuidv4(), name: user.name, created_at: date } },
      },
    });

    return provider?.member;
  }

  private login(member: { id: string; name: string }) {
    const payload: { id: string } = { id: member.id };

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
