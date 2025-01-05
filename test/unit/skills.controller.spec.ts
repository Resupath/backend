import { Test, TestingModule } from '@nestjs/testing';
import { AppModule } from 'src/app.module';
import { SkillsController } from 'src/controllers/skills.controller';

describe('Skills', () => {
  let controller: SkillsController;

  beforeAll(async () => {
    const module: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
