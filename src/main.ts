import { NestFactory } from '@nestjs/core';
import { SwaggerModule } from '@nestjs/swagger';
import { readFileSync } from 'fs';
import * as path from 'path';
import { AppModule } from './app.module';
import { HttpExceptionFilter } from './filter/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swgger 세팅
  const swaagerConfig = readFileSync(path.join(__dirname, '../swagger.json'), 'utf8');
  const swaggerDocument = JSON.parse(swaagerConfig);
  SwaggerModule.setup('api/swagger', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
