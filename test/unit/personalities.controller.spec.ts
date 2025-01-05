import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { PersonalitiesController } from 'src/controllers/personalities.controller';

describe('Personalities', () => {
  let controller: PersonalitiesController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<PersonalitiesController>(PersonalitiesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * 성격을 페이지네이션으로 조회할 수 있어야 한다.
   * 일단은 단순 조회로 구현하나 추후 상위 노출에 대한 요구사항이 발생할 수 있다.
   */

  it.todo('성격 리스트 조회가 가능해야 한다.');
});
