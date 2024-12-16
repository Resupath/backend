import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { SwaggerModule } from '@nestjs/swagger';
import * as path from 'path';
import { readFileSync } from 'fs';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();

  // Swgger 세팅
  const swaagerConfig = readFileSync(
    path.join(__dirname, '../swagger.json'),
    'utf8',
  );
  const swaggerDocument = JSON.parse(swaagerConfig);
  SwaggerModule.setup('api/swagger', app, swaggerDocument);

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
