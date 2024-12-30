import { Test, TestingModule } from '@nestjs/testing';
import { SourcesController } from 'src/controllers/sources.controller';
import { SourcesService } from 'src/services/sources.service';

describe('SourcesController', () => {
  let controller: SourcesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SourcesController],
      providers: [SourcesService],
    }).compile();

    controller = module.get<SourcesController>(SourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
