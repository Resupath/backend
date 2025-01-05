import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { AuthController } from 'src/controllers/auth.controller';

describe('Auth', () => {
  let controller: AuthController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<AuthController>(AuthController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   *
   * 구글 OAuth 연동을 한다.
   * 1. 프론트에서 OAuth를 통해 로그인한다
   * 2. 프론트에서 Redirect URI는 백엔드 서버의 URL로 하여, 백엔드 서버가 인증 정보를 취득한다.
   * 3. 백엔드 서버는 해당 정보를 가지고 유저 데이터를 조회한다.
   *   - 이미 정보가 있다면 로그인
   *   - 정보가 아직 없다면 회원가입
   */
});
