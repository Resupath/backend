import { INestiaConfig } from '@nestia/sdk';
import { NestFactory } from '@nestjs/core';

import { AppModule } from './src/app.module';

export const NESTIA_CONFIG: INestiaConfig = {
  input: () => NestFactory.create(AppModule),
  output: 'src/api', // typescript 파일로서 SDK를 생성
  swagger: {
    output: './swagger.json', // 스웨거 json 파일 생성 위치
    servers: [
      {
        url: 'http://localhost:3000', // 스웨거에서 요청 보낼 URL 경로
        description: 'Local Server',
      },
    ],
    beautify: true,
  },
  primitive: false,
  simulate: true,
};
export default NESTIA_CONFIG;
