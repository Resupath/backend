import { IConnection } from '@nestia/fetcher';
import { INestApplication } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { randomInt } from 'crypto';
import { AppModule } from 'src/app.module';
import { test_api_getHello } from 'test/features/test_api_getHello';

describe('App Test', () => {
  let app: INestApplication;
  let connection: IConnection;
  let PORT: number;

  beforeAll(async () => {
    PORT = randomInt(10000, 50000);

    app = await NestFactory.create(AppModule);

    await app.listen(PORT);

    connection = {
      host: `http://127.0.0.1:${PORT}`,
      headers: {},
    };
  });

  afterAll(async () => {
    await app.close();
  });

  it('should be defined', () => {
    expect(app).toBeDefined();
  });

  it('GET Hello World!', async () => {
    await test_api_getHello(connection);
  });
});
