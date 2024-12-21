import { Test, TestingModule } from '@nestjs/testing';
import { CharactersController } from '../../src/controllers/characters.controller';
import { CharactersService } from 'src/services/characters.service';

describe('CharactersController', () => {
  let controller: CharactersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CharactersController],
      providers: [CharactersService],
    }).compile();

    controller = module.get<CharactersController>(CharactersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it.todo('캐릭터가 생성되었다면 id로 조회할 수 있어야 한다.');
});
