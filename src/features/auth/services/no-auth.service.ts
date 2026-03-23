import { Injectable, Logger } from '@nestjs/common';
import { IAuthUser } from '../types';

@Injectable()
export class NoAuthService {
  private readonly logger = new Logger(NoAuthService.name);
  public readonly enabled: boolean;
  public readonly adminUser: IAuthUser;

  constructor() {
    const isProduction = process.env['NODE_ENV'] === 'production';
    const noAuthRequested = process.env['NO_AUTH'] === 'true';

    if (noAuthRequested && isProduction) {
      this.logger.warn('NO_AUTH cannot be enabled in production environment');
    }

    this.enabled = noAuthRequested && !isProduction;
    this.adminUser = {
      userId: 'no-auth-admin',
      email: 'admin@example.com',
      username: 'admin',
      roleId: 'admin',
    };
  }
}
