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
  async getGoogleLoginUrl(redirectUri?: string) {
    const google = this.getGoogleClient();
    const scope = encodeURIComponent('profile email'); // 허용된 스코프는 프로필과 이메일이다.

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${google.clientId}&redirect_uri=${redirectUri ?? google.redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
  }

  /**
   * 구글 로그인 결과를 검증하고 jwt를 발급한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getGoogleAuthorization(userId: string, input: Auth.LoginRequest) {
    try {
      const { accessToken, refreshToken } = await this.getGoogleAccessToken(input);
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
      throw new UnauthorizedException('구글 로그인에 실패했습니다.');
    }
  }

  /**
   * 노션 로그인 페이지의 url을 반환한다.
   */
  async getNotionLoginUrl(redirectUri?: string) {
    const notion = this.getNotionClient();
    return `https://api.notion.com/v1/oauth/authorize?client_id=${notion.clientId}&response_type=code&owner=user&redirect_uri=${redirectUri ?? notion.redirectUri}`;
  }

  /**
   * 노션 인증 결과를 검증하고 jwt를 발급한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getNotionAuthorization(userId: string, input: Auth.LoginRequest) {
    try {
      const notion = await this.getNotionAccessTokenAndUserinfo(input);
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
      throw new UnauthorizedException('노션 연동에 실패했습니다.');
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

  /**
   * 깃허브 로그인 url을 반환한다.
   */
  async getGithubLoginUrl(redirectUri?: string) {
    const github = this.getGithubClient();
    return `https://github.com/login/oauth/authorize?client_id=${github.clientId}&redirect_uri=${redirectUri ?? github.redirectUri}&scope=user&prompt=select_account`;
  }

  /**
   * 깃허브 인증 결과를 검증하고 jwt를 발급한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getGithubAuthorization(userId: string, input: Auth.LoginRequest) {
    try {
      const { accessToken } = await this.getGithubAccessToken(input);
      const { uid, email, name } = await this.getGithubUserInfo(accessToken);

      if (!email) {
        throw new NotFoundException(
          `깃허브 로그인 실패. 이메일을 읽어오는데에 실패했습니다. public 이메일이 설정되어있지 않습니다.`,
        );
      }

      const member = await this.findOrCreateMember(userId, {
        uid,
        email,
        name,
        accessToken,
        refreshToken: accessToken, // 깃허브 Oauth는 refresh token을 제공하지 않아 accessToken으로 저장한다.
        type: 'github',
      });

      return this.login(member);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('깃허브 연동에 실패했습니다.');
    }
  }

  /**
   * 프로바이더(OAuth 연동) 정보를 저장한다.
   */
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

  /**
   * Oauth 인증정보를 바탕으로 프로바이더(OAuth 연동) 정보를 조회해 있다면 프로바이더 정보를 갱신해 반환
   * 없다면 새롭게 멤버-프로바이더 정보를 저장한다.
   *
   * @param userId
   * @param authorization
   */
  async findOrCreateMember(userId: string, authorization: Auth.CommonAuthorizationResponse) {
    const provider = await this.findProviderMember(authorization);

    return provider
      ? await this.updateProviderPassword(userId, provider.id, authorization.refreshToken)
      : await this.createMember(userId, authorization);
  }

  /**
   * Oauth 인증정보를 바탕으로 프로바이더(OAuth 연동) 정보를 조회한다.
   */
  async findProviderMember(authorization: Auth.CommonAuthorizationResponse) {
    const provider = await this.prisma.provider.findFirst({
      select: { id: true, member: { select: { id: true, name: true } } },
      where: {
        AND: [{ uid: authorization.uid }, { type: authorization.type }, { type: { not: 'notion' } }],
      },
    });

    return provider;
  }

  /**
   * 연관된 user 아이디를 찾아 반환한다. (동일한 멤버로 묶인 user들의 집합을 찾는데에 사용한다.)
   */
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

  /**
   * 프로바이더(OAuth 연동) 정보를 갱신한다.
   */
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

  /**
   * 멤버-프로바이더 정보를 저장한다.
   */
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

  /**
   * user 토큰을 발급한다.
   */
  createUserToken(user: Pick<User, 'id'>): Auth.UserToken {
    const accessToken = this.jwtService.sign(user, {
      secret: this.configService.get('JWT_SECRET_USER'),
    });

    return { accessToken };
  }

  /**
   * user와 연관된 member 정보를 반환한다.
   */
  private async getMember(userId: string): Promise<{ memberId: string }> {
    const member = await this.prisma.user.findUnique({
      select: { member_id: true },
      where: {
        id: userId,
      },
    });

    if (!member || !member.member_id) {
      throw new NotFoundException(
        `유저 아이디를 이용한 멤버 정보 조회 실패, 회원가입된 유저가 아닙니다. userId: ${userId}`,
      );
    }

    return { memberId: member.member_id };
  }

  /**
   * 리프레쉬 토큰을 검증한다.
   */
  private async verifyRefreshToken(refreshToken: string): Promise<{ id: string; name: string }> {
    try {
      const payload = this.jwtService.verify(refreshToken, {
        secret: this.configService.get('JWT_REFRESH_SECRET_MEMBER'),
      });
      return payload as { id: string; name: string };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('리프레쉬 토큰 검증 실패. 만료되었거나 잘못된 토큰입니다.');
    }
  }

  /**
   * 로그인. 멤버 정보를 바탕으로 JWT를 발급한다.
   */
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

  /**
   * google
   *
   * code를 구글 OAuth 토큰으로 교환한다. 유저 정보를 받아오는데에 사용한다.
   */
  private async getGoogleAccessToken(input: Auth.LoginRequest) {
    const { clientId, clientSecret, redirectUri } = this.getGoogleClient();

    const response = await axios.post<{
      access_token: string;
      refresh_token: string;
      token_type: 'Bearer';
      scope: string;
      expires_in: number;
    }>(`https://oauth2.googleapis.com/token`, {
      code: input.code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: input.redirectUri ?? redirectUri,
      grant_type: 'authorization_code',
    });

    return {
      accessToken: response.data.access_token,
      refreshToken: response.data.refresh_token,
    };
  }

  /**
   * google
   *
   * access token을 사용해 구글 유저 정보를 조회한다.
   */
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

  /**
   * notion
   *
   * code를 이용해 인증후 노션 사용자 정보를 받아온다.
   */
  private async getNotionAccessTokenAndUserinfo(input: Auth.LoginRequest) {
    const { clientId, clientSecret, redirectUri } = this.getNotionClient();

    const basicAuth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const response = await axios.post<NotionUtil.AuthorizationResponse>(
      `https://api.notion.com/v1/oauth/token`,
      {
        grant_type: 'authorization_code',
        code: input.code,
        redirect_uri: input.redirectUri ?? redirectUri,
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

  /**
   * github
   *
   * code를 이용해 깃허브 Access Token을 가져온다.
   */
  private async getGithubAccessToken(input: Auth.LoginRequest) {
    const { clientId, clientSecret, redirectUri } = this.getGithubClient();

    const response = await axios.post<{
      access_token: string;
      scope: string;
      token_type: 'bearer';
    }>(
      `https://github.com/login/oauth/access_token`,
      {
        client_id: clientId,
        client_secret: clientSecret,
        code: input.code,
        redirect_uri: input.redirectUri ?? redirectUri,
      },
      {
        headers: {
          Accept: 'application/json',
        },
      },
    );

    return { accessToken: response.data.access_token };
  }

  /**
   * github
   *
   * 깃허브 유저 데이터를 가져온다.
   */
  private async getGithubUserInfo(accessToken: string) {
    const response = await axios.get<{
      login: string;
      id: number;
      node_id: string;
      avatar_url: string;
      gravatar_id: string;
      url: string;
      html_url: string;
      followers_url: string;
      following_url: string;
      gists_url: string;
      starred_url: string;
      subscriptions_url: string;
      organizations_url: string;
      repos_url: string;
      events_url: string;
      received_events_url: string;
      type: string;
      user_view_type: string;
      site_admin: boolean;
      name: string;
      company: string | null;
      blog: string;
      location: string | null;
      email: string | null;
      hireable: boolean | null;
      bio: string | null;
      twitter_username: string | null;
      notification_email: string | null;
      public_repos: number;
      public_gists: number;
      followers: number;
      following: number;
      created_at: string;
      updated_at: string;
    }>('https://api.github.com/user', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    return { uid: `${response.data.id}`, email: response.data.email, name: response.data.name };
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

  private getGithubClient() {
    return {
      clientId: this.configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GITHUB_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GITHUB_REDIRECT_URI'),
    };
  }
}
