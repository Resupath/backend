import { Test, TestingModule } from '@nestjs/testing';
import { PositionsController } from 'src/controllers/positions.controller';
import { PositionsService } from '../../src/services/positions.service';

describe('PositionsController', () => {
  let controller: PositionsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PositionsController],
      providers: [PositionsService],
    }).compile();

    controller = module.get<PositionsController>(PositionsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  /**
   * 사용자는 직군을 생성 및 조회할 수 있다.
   *
   * 사용자는 검색을 통해 이미 저장되어있는 직군을 확인할 수 있으며, 없는 경우 등록할 수 있다.
   */
});
