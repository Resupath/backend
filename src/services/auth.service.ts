import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import axios from 'axios';
import { randomUUID } from 'crypto';
import { Auth } from 'src/interfaces/auth.interface';
import { Provider } from 'src/interfaces/provider.interface';
import { User } from 'src/interfaces/user.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { NotionUtil } from 'src/util/notion.util';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * user를 생성한다.
   */
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
  async getGoogleAuthorization(userId: string, code: string) {
    try {
      const { accessToken, refreshToken } = await this.getGoogleAccessToken(code);
      const { uid, email, name } = await this.getGoogleUserInfo(accessToken);

      const member = await this.findOrCreateMember(userId, {
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

  /**
   * 노션 로그인 페이지의 url을 반환한다.
   */
  async getNotionLoginUrl() {
    const { clientId, redirectUri } = this.getNotionClient();
    return `https://api.notion.com/v1/oauth/authorize?client_id=${clientId}&response_type=code&owner=user&redirect_uri=${redirectUri}`;
  }

  /**
   * 노션 인증 결과를 검증하고 jwt를 발급한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getNotionAuthorization(userId: string, code: string) {
    try {
      const notion = await this.getNotionAccessTokenAndUserinfo(code);
      const { memberId } = await this.getMember(userId);

      await this.createProvider(memberId, {
        uid: notion.owner.user.id,
        email: notion.owner.user.person.email,
        name: notion.owner.user.name,
        accessToken: notion.access_token,
        refreshToken: notion.access_token, // 노션의 경우 access 토큰의 만료가 없음으로 access 토큰을 저장한다.
        type: 'notion',
      });
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException();
    }
  }

  /**
   * 해당 유저와 연관된 멤버에게 notion provider 조회결과가 있는지 확인한다.
   * @param userId
   */
  async getNotionAccessTokenByUserId(userId: string): Promise<Pick<Provider, 'id' | 'password'>> {
    const { memberId } = await this.getMember(userId);
    return await this.getNotionAccessTokenByMemberId(memberId);
  }

  /**
   * 해당 멤버의 notion provider 조회 결과가 있는지 확인한다.
   */
  async getNotionAccessTokenByMemberId(memberId: string): Promise<Pick<Provider, 'id' | 'password'>> {
    const provider = await this.prisma.provider.findFirst({
      select: { id: true, password: true },
      where: {
        member_id: memberId,
        type: 'notion',
      },
    });

    if (!provider) {
      throw new NotFoundException('노션 연동정보가 존재하지 않습니다.');
    }

    return provider;
  }

  async createProvider(memberId: string, authorization: Auth.CommonAuthorizationResponse): Promise<void> {
    const date = DateTimeUtil.now();
    await this.prisma.provider.create({
      data: {
        id: randomUUID(),
        uid: authorization.uid,
        password: authorization.refreshToken,
        type: authorization.type,
        created_at: date,
        member_id: memberId,
      },
    });
  }

  async findOrCreateMember(userId: string, authorization: Auth.CommonAuthorizationResponse) {
    const provider = await this.findProviderMember(authorization);

    return provider
      ? await this.updateProviderPassword(userId, provider.id, authorization.refreshToken)
      : await this.createMember(userId, authorization);
  }

  async findProviderMember(authorization: Auth.CommonAuthorizationResponse) {
    const provider = await this.prisma.provider.findFirst({
      select: { id: true, member: { select: { id: true, name: true } } },
      where: {
        AND: [{ uid: authorization.uid }, { type: authorization.type }, { type: { not: 'notion' } }],
      },
    });

    return provider;
  }

  async findUserIds(userId: User['id']): Promise<Array<User['id']>> {
    const users = await this.prisma.user.findMany({
      select: {
        id: true,
      },
      where: {
        OR: [{ id: userId }, { member: { users: { some: { id: userId } } } }],
      },
    });

    return users.map((user) => user.id);
  }

  async updateProviderPassword(userId: User['id'], providerId: Provider['id'], refreshToken: string) {
    const member = await this.prisma.$transaction(async (prisma) => {
      const { member } = await prisma.provider.update({
        select: { member: { select: { id: true, name: true } } },
        data: { password: refreshToken },
        where: { id: providerId },
      });

      await prisma.user.update({
        where: { id: userId },
        data: { member_id: member.id },
      });
      return member;
    });

    return member;
  }

  async createMember(userId: string, authorization: Auth.CommonAuthorizationResponse) {
    const memberId = randomUUID();
    const date = DateTimeUtil.now();

    const [{ member }] = await this.prisma.$transaction([
      this.prisma.provider.create({
        select: { member: { select: { id: true, name: true } } },
        data: {
          id: randomUUID(),
          uid: authorization.uid,
          password: authorization.refreshToken,
          type: authorization.type,
          created_at: date,
          member: {
            create: {
              id: memberId,
              name: authorization.name,
              created_at: date,
            },
          },
        },
      }),
      this.prisma.user.update({
        where: { id: userId },
        data: { member_id: memberId },
      }),
    ]);

    return member;
  }

  createUserToken(user: Pick<User, 'id'>): Auth.UserToken {
    const accessToken = this.jwtService.sign(user, {
      secret: this.configService.get('JWT_SECRET_USER'),
    });

    return { accessToken };
  }

  private async getMember(userId: string): Promise<{ memberId: string }> {
    const member = await this.prisma.user.findUnique({
      select: { member_id: true },
      where: {
        id: userId,
      },
    });

    if (!member || !member.member_id) {
      throw new NotFoundException();
    }

    return { memberId: member.member_id };
  }

  private async verifyRefreshToken(refreshToken: string): Promise<{ id: string; name: string }> {
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

  private async getNotionAccessTokenAndUserinfo(code: string) {
    const { clientId, clientSecret, redirectUri } = this.getNotionClient();

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post<NotionUtil.AuthorizationResponse>(
      `https://api.notion.com/v1/oauth/token`,
      {
        grant_type: 'authorization_code',
        code,
        redirect_uri: redirectUri,
      },
      {
        headers: {
          Authorization: `Basic ${basicAuth}`,
          'Content-Type': 'application/json',
        },
      },
    );

    return response.data;
  }

  private getGoogleClient() {
    return {
      clientId: this.configService.get<string>('GOOGLE_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GOOGLE_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GOOGLE_REDIRECT_URI'),
    };
  }

  private getNotionClient() {
    return {
      clientId: this.configService.get<string>('NOTION_CLIENT_ID'),
      clientSecret: this.configService.get<string>('NOTION_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('NOTION_REDIRECT_URI'),
    };
  }
}
