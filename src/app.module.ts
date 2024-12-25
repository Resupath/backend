import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './modules/auth.module';
import { CharactersModule } from './modules/characters.module';
import { ExperiencesModule } from './modules/experiences.module';
import { PersonalitiesModule } from './modules/personalities.module';
import { PositionsModule } from './modules/positions.module';
import { PrismaModule } from './modules/prisma.module';
import { RoomsModule } from './modules/rooms.module';

@Module({
  imports: [
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    PrismaModule,
    AuthModule,
    CharactersModule,
    PersonalitiesModule,
    ExperiencesModule,
    PositionsModule,
    RoomsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
