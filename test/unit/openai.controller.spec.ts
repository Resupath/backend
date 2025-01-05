import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { OpenaiService } from 'src/services/openai.service';

describe('Openai', () => {
  let service: OpenaiService;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    service = module.get<OpenaiService>(OpenaiService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
