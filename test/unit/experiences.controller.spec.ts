import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ExperiencesController } from 'src/controllers/experiences.controller';

describe('Experiences', () => {
  let controller: ExperiencesController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<ExperiencesController>(ExperiencesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * Member는 경력을 생성/조회/수정 할 수 있어야 한다.
   *
   * 경력은 사용자가 보고 있는 순서를 지켜 생성/조회/수정 되어야 한다.
   */
  it.todo('경력 수정시 순서가 변경되었다면, 조회시 지정한 순서대로 조회되어야 한다.');
});
