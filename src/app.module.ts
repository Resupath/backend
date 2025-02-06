import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { LoggerMiddleware } from './middlewares/logger.middleware';
import { AuthModule } from './modules/auth.module';
import { CharactersModule } from './modules/characters.module';
import { ChatsModule } from './modules/chats.module';
import { ExperiencesModule } from './modules/experiences.module';
import { FileModule } from './modules/files.module';
import { MembersModule } from './modules/members.module';
import { PersonalitiesModule } from './modules/personalities.module';
import { PositionsModule } from './modules/positions.module';
import { PrismaModule } from './modules/prisma.module';
import { RoomsModule } from './modules/rooms.module';
import { SkillsModule } from './modules/skills.module';
import { SourcesModule } from './modules/sources.module';
console.log(process.env.NODE_ENV);

@Module({
  imports: [
    JwtModule.register({ global: true }),
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [process.env.NODE_ENV === 'development' ? '.env.dev' : '.env.prod', '.env'],
    }),
    PrismaModule,
    AuthModule,
    CharactersModule,
    PersonalitiesModule,
    ExperiencesModule,
    PositionsModule,
    ChatsModule,
    RoomsModule,
    SkillsModule,
    SourcesModule,
    FileModule,
    MembersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(LoggerMiddleware).forRoutes('*');
    console.log(process.env.DATABASE_URL);
  }
}
