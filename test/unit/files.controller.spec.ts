import { Test, TestingModule } from '@nestjs/testing';
import { FilesController } from 'src/controllers/files.controller';
import { S3Service } from 'src/services/files.service';

describe('FileController', () => {
  let controller: FilesController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FilesController],
      providers: [S3Service],
    }).compile();

    controller = module.get<FilesController>(FilesController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
