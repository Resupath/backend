import { Global, Module } from '@nestjs/common';
import { AuthController } from 'src/controllers/auth.controller';
import { AuthService } from 'src/services/auth.service';
import { OAuthService } from 'src/services/oauth.service';

@Global()
@Module({
  controllers: [AuthController],
  providers: [AuthService, OAuthService],
  exports: [AuthService],
})
export class AuthModule {}
