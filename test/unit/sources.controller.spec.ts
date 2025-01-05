import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { SourcesController } from 'src/controllers/sources.controller';
import { PromptUtil } from 'src/util/prompt.util';

describe('Sources', () => {
  let controller: SourcesController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<SourcesController>(SourcesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
