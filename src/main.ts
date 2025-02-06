import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { existsSync, readFileSync, writeFileSync } from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swgger 세팅
  const swaggerFilePath = path.join(__dirname, '../swagger.json');

  if (!existsSync(swaggerFilePath)) {
    writeFileSync(swaggerFilePath, '{}');
  }
  const swaagerConfig = readFileSync(swaggerFilePath, 'utf8');
  const swaggerDocument = JSON.parse(swaagerConfig);
  SwaggerModule.setup('api/swagger', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
