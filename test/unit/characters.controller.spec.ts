import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { CharactersController } from '../../src/controllers/characters.controller';

describe('Characters', () => {
  let controller: CharactersController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<CharactersController>(CharactersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it.todo('캐릭터가 생성되었다면 id로 조회할 수 있어야 한다.');
});
