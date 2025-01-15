import { HttpError, IConnection } from '@nestia/fetcher';
import { INestApplication, NotFoundException } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomInt } from 'crypto';
import { AppModule } from 'src/app.module';
import { Experience } from 'src/interfaces/experiences.interface';
import { test_api_refresh } from 'test/features/auth/test_api_refresh';
import { test_api_createExperiences } from 'test/features/experiences/test_api_createExperiences';
import { test_api_deleteExperience } from 'test/features/experiences/test_api_deleteExperience';
import { test_api_getAllExperiences } from 'test/features/experiences/test_api_getAllExperiences';
import { test_api_getExperience } from 'test/features/experiences/test_api_getExperience';
import { test_api_updateExperience } from 'test/features/experiences/test_api_updateExperience';
import typia from 'typia';

describe('Experiences Test', () => {
  let app: INestApplication;
  let connection: IConnection;
  let PORT: number;

  beforeAll(async () => {
    PORT = randomInt(10000, 50000);

    app = await NestFactory.create(AppModule);

    await app.listen(PORT);

    connection = {
      host: `http://127.0.0.1:${PORT}`,
    };

    const member = await test_api_refresh(connection);
    connection.headers = {
      'x-member': `Bearer ${member.accessToken}`,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
    expect(app).toBeDefined();
  });

  it('경력을 생성한다. 1개 이상의 경력을 생성할 수 있어야 한다.', async () => {
    const inputLength = 3; // 여기서는 3개의 경력을 생성한다.
    const input: Experience.CreateManyRequest = {
      experiences: new Array(inputLength).fill(0).map((el, index) => {
        return {
          companyName: `test_companyName_${index}`,
          startDate: `202${index}-01-01`,
          endDate: `202${index}-12-01`,
          position: 'BackEnd',
          sequence: index,
          description: `test_description_${index}`,
        };
      }),
    };

    await test_api_createExperiences(connection, input);
  });

  it('경력들을 조회한다. 앞서 생성되었기 때문에 경력은 1개 이상 조회되어야 한다.', async () => {
    const experiences = await test_api_getAllExperiences(connection);
    expect(experiences.length > 1).toBe(true);
  });

  it('경력을 수정한다. id를 기반으로 조회하고 수정할 수 있어야 한다.', async () => {
    // 1. test 경력을 한 개 생성한다.
    const newExperiences = await test_api_createExperiences(connection);
    const testExperience = newExperiences?.at(0);
    expect(testExperience).toBeDefined();

    const testId = testExperience?.id as string;

    // 2. test 경력을 조회한다.
    const experience = await test_api_getExperience(connection, testId);

    // 3. 경력데이터를 수정한다.
    const updateInput: Experience.UpdateRequest = {
      companyName: `companyName`,
      startDate: `2020-12-01`,
      endDate: `2022-12-01`,
      position: 'FrontEnd',
      description: `description`,
    };
    await test_api_updateExperience(connection, testId, updateInput);

    // 4. test 경력을 다시 조회한다.
    const updatedExperience = await test_api_getExperience(connection, testId);

    expect(experience).not.toBe(updatedExperience);
  });

  it('경력을 삭제한다. 삭제되었다면 조회할 수 없어야 한다.', async () => {
    // 1. test 경력을 한 개 생성한다.
    const newExperiences = await test_api_createExperiences(connection);
    const testExperience = newExperiences?.at(0);
    expect(testExperience).toBeDefined();

    const testId = testExperience?.id as string;
    await test_api_deleteExperience(connection, testId);

    // 2. 삭제 후 조회했을 때 NotFoundException이 발생해야 한다.
    await expect(test_api_getExperience(connection, testId)).rejects.toBeInstanceOf(HttpError);
  });
});
