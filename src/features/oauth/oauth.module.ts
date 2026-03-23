import { Module } from '@nestjs/common';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { OAuthController } from './oauth.controller';
import { OAuthClientService } from './oauth-client.service';
import { OAuthAuthorizationService } from './oauth-authorization.service';
import { OAuthTokenService } from './oauth-token.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OAuthController],
  providers: [OAuthClientService, OAuthAuthorizationService, OAuthTokenService],
  exports: [OAuthTokenService],
})
export class OAuthModule {}
