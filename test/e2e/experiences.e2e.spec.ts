import { IConnection } from '@nestia/fetcher';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomInt } from 'crypto';
import { AppModule } from 'src/app.module';
import { Experience } from 'src/interfaces/experiences.interface';
import { test_api_refresh } from 'test/features/auth/test_api_refresh';
import { test_api_createExperiences } from 'test/features/experiences/test_api_createExperiences';
import { test_api_getAllExperiences } from 'test/features/experiences/test_api_getAllExperiences';

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
});
