import { BadRequestException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { randomUUID } from 'crypto';
import { Auth } from 'src/interfaces/auth.interface';
import { Provider } from 'src/interfaces/provider.interface';
import { User } from 'src/interfaces/user.interface';
import { DateTimeUtil } from 'src/util/date-time.util';
import { OAuthService } from './oauth.service';
import { PrismaService } from './prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly oAuthService: OAuthService,
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
   * OAuth 로그인 url을 반환한다.
   */
  async getLoginUrl(provider: Provider['type'], redirectUri?: string) {
    if (provider === 'google') {
      return await this.oAuthService.getGoogleLoginUrl(redirectUri);
    } else if (provider === 'notion') {
      return await this.oAuthService.getNotionLoginUrl(redirectUri);
    } else if (provider === 'github') {
      return await this.oAuthService.getGithubLoginUrl(redirectUri);
    } else if (provider === 'linkedin') {
      return await this.oAuthService.getLinkedinLoginUrl(redirectUri);
    } else {
      throw new BadRequestException(`지원하는 로그인이 아닙니다.`);
    }
  }

  /**
   * OAuth 사용자를 인증하고, 토큰을 발급한다.
   * 새로운 사용자라면 회원가입을, 아니라면 로그인 처리된다.
   */
  async getAuthorization(provider: Provider['type'], userId: string, input: Auth.LoginRequest) {
    let userInfo: Auth.CommonAuthorizationResponse;
    try {
      if (provider === 'google') {
        userInfo = await this.oAuthService.getGoogleAuthorization(input);
      } else if (provider === 'github') {
        userInfo = await this.oAuthService.getGithubAuthorization(input);
      } else if (provider === 'linkedin') {
        userInfo = await this.oAuthService.getLinkedinAuthorization(input);
      } else {
        throw new BadRequestException(`지원하는 로그인이 아닙니다.`);
      }

      const member = await this.findOrCreateMember(userId, userInfo);
      return this.login(member);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException(`${provider} 로그인에 실패했습니다. ${error.message}`);
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
}
