import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { FilesController } from 'src/controllers/files.controller';

describe('File', () => {
  let controller: FilesController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
