import { Test, TestingModule } from '@nestjs/testing';
import { SkillsController } from 'src/controllers/skills.controller';
import { SkillsService } from 'src/services/skills.service';

describe('SkillsController', () => {
  let controller: SkillsController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SkillsController],
      providers: [SkillsService],
    }).compile();

    controller = module.get<SkillsController>(SkillsController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
