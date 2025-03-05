import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { Auth } from 'src/interfaces/auth.interface';
import { NotionUtil } from 'src/util/notion.util';

@Injectable()
export class OAuthService {
  constructor(private readonly configService: ConfigService) {}

  /**
   * 구글 로그인 페이지의 url을 반환한다.
   */
  async getGoogleLoginUrl(redirectUri?: string) {
    const google = this.getGoogleClient();
    const scope = encodeURIComponent('profile email'); // 허용된 스코프는 프로필과 이메일이다.

    return `https://accounts.google.com/o/oauth2/v2/auth?client_id=${google.clientId}&redirect_uri=${redirectUri ?? google.redirectUri}&scope=${scope}&response_type=code&access_type=offline&prompt=consent`;
  }

  /**
   * 노션 로그인 페이지의 url을 반환한다.
   */
  async getNotionLoginUrl(redirectUri?: string) {
    const notion = this.getNotionClient();
    return `https://api.notion.com/v1/oauth/authorize?client_id=${notion.clientId}&response_type=code&owner=user&redirect_uri=${redirectUri ?? notion.redirectUri}`;
  }

  /**
   * 깃허브 로그인 url을 반환한다.
   */
  async getGithubLoginUrl(redirectUri?: string) {
    const github = this.getGithubClient();
    return `https://github.com/login/oauth/authorize?client_id=${github.clientId}&redirect_uri=${redirectUri ?? github.redirectUri}&scope=user&prompt=select_account`;
  }

  /**
   * 링크드인 로그인 url을 반환한다.
   */
  async getLinkedinLoginUrl(redirectUri?: string) {
    const linkedin = this.getLinkedinClient();
    return `https://www.linkedin.com/oauth/v2/authorization?response_type=code&client_id=${linkedin.clientId}&redirect_uri=${redirectUri ?? linkedin.redirectUri}&scope=openid%20profile%20email`;
  }

  /**
   * 구글 로그인 결과를 검증하고 유저 데이터를 반환한다.
   */
  async getGoogleAuthorization(input: Auth.LoginRequest): Promise<Auth.CommonAuthorizationResponse> {
    const { accessToken, refreshToken } = await this.getGoogleAccessToken(input);
    const { uid, name } = await this.getGoogleUserInfo(accessToken);

    return { uid, name, accessToken, refreshToken, type: 'google' };
  }

  /**
   * 노션 인증 결과를 검증하고 유저 데이터를 반환한다.
   */
  async getNotionAuthorization(input: Auth.LoginRequest): Promise<Auth.CommonAuthorizationResponse> {
    const notion = await this.getNotionAccessTokenAndUserinfo(input);

    return {
      uid: notion.owner.user.id,
      name: notion.owner.user.name,
      accessToken: notion.access_token,
      refreshToken: notion.access_token, // 노션의 경우 access 토큰의 만료가 없음으로 access 토큰을 저장한다.
      type: 'notion',
    };
  }

  /**
   * 깃허브 인증 결과를 검증하고 유저 정보를 반환한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getGithubAuthorization(input: Auth.LoginRequest): Promise<Auth.CommonAuthorizationResponse> {
    const { accessToken } = await this.getGithubAccessToken(input);
    const { uid, name } = await this.getGithubUserInfo(accessToken);

    return {
      uid,
      name,
      accessToken,
      refreshToken: accessToken, // 깃허브 Oauth는 refresh token을 제공하지 않아 accessToken으로 저장한다.
      type: 'github',
    };
  }

  /**
   * 링크드인 인증 결과를 검증하고 jwt를 발급한다.
   * @param code 클라이언트의 로그인 성공 시 얻을수 있는 코드값.
   */
  async getLinkedinAuthorization(input: Auth.LoginRequest): Promise<Auth.CommonAuthorizationResponse> {
    const { accessToken } = await this.getLinkedinAccessToken(input);
    const { uid, name } = await this.getLinkedinUserInfo(accessToken);

    return {
      uid,
      name,
      accessToken,
      refreshToken: accessToken, // 링크드인 Oauth는 refresh token을 제공하지 않아 accessToken으로 저장한다.
      type: 'linkedin',
    };
  }

  /**
   * 허가된 노션 페이지를 조회한다.
   */
  async getNotionAccessPages(accessToken: string): Promise<Array<NotionUtil.VerifyPageResponse>> {
    const { apiVersion } = this.getNotionClient();

    try {
      const response = await axios.post(
        `https://api.notion.com/v1/search`,
        {
          filter: {
            value: 'page',
            property: 'object',
          },
        },
        {
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Notion-Version': apiVersion,
          },
        },
      );

      const page = response.data.results;

      return page.map(
        (el): NotionUtil.VerifyPageResponse => ({
          id: el.id,
          title: el.properties.title.title[0].plain_text,
          url: el.url,
        }),
      );
    } catch (error) {
      throw new InternalServerErrorException(`노션 페이지 정보 읽어오기 실패.`);
    }
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

    return { uid: `${response.data.id}`, name: response.data.name };
  }

  /**
   * Linked-In
   *
   * code를 링크드인 OAuth 토큰으로 교환한다. 유저 정보를 받아오는데에 사용한다.
   */
  private async getLinkedinAccessToken(input: Auth.LoginRequest) {
    const { clientId, clientSecret, redirectUri } = this.getLinkedinClient();

    const response = await axios.post<{ access_token: string; expires_in: number; scope: string }>(
      `https://www.linkedin.com/oauth/v2/accessToken`,
      {
        grant_type: 'authorization_code',
        code: input.code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: input.redirectUri ?? redirectUri,
      },
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
    );

    return { accessToken: response.data.access_token };
  }

  /**
   * Linked-In
   *
   * access token을 사용해 링크드인 유저 정보를 조회한다.
   */
  private async getLinkedinUserInfo(accessToken: string) {
    const response = await axios.get<{
      sub: string;
      email_verified: boolean;
      name: string;
      locale: object;
      given_name: string;
      family_name: string;
      email: string;
    }>('https://api.linkedin.com/v2/userinfo', {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });
    return { uid: response.data.sub, name: response.data.name };
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
      apiVersion: this.configService.get<string>('NOTION_API_VERSION'),
    };
  }

  private getGithubClient() {
    return {
      clientId: this.configService.get<string>('GITHUB_CLIENT_ID'),
      clientSecret: this.configService.get<string>('GITHUB_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('GITHUB_REDIRECT_URI'),
    };
  }

  private getLinkedinClient() {
    return {
      clientId: this.configService.get<string>('LINKEDIN_CLIENT_ID'),
      clientSecret: this.configService.get<string>('LINKEDIN_CLIENT_SECRET'),
      redirectUri: this.configService.get<string>('LINKEDIN_REDIRECT_URI'),
    };
  }
}
