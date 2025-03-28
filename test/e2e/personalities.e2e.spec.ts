import { IConnection } from '@nestia/fetcher';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomInt } from 'crypto';
import { AppModule } from 'src/app.module';
import { test_api_getPersonalitiesByPage } from 'test/features/personalities/test_api_getPersonalitiesByPage';

describe('Personalities Test', () => {
  let app: INestApplication;
  let connection: IConnection;

  beforeAll(async () => {
    const PORT = randomInt(10000, 50000);
    app = await NestFactory.create(AppModule);

    await app.listen(PORT);

    connection = {
      host: `http://127.0.0.1:${PORT}`,
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('성격들을 페이지네이션으로 조회한다. 생성되어있다고 가정하고 1개 이상 조회되어야 한다.', async () => {
    const personalities = await test_api_getPersonalitiesByPage(connection);
    expect(personalities.data.length > 0).toBe(true);
  });
});
