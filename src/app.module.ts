import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { PrismaModule } from './modules/prisma.module';
import { CharactersModule } from './modules/characters.module';

@Module({
  imports: [
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CharactersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
