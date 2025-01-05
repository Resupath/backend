import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { ChatsController } from 'src/controllers/chats.controller';

describe('Chats', () => {
  let controller: ChatsController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    controller = module.get<ChatsController>(ChatsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
