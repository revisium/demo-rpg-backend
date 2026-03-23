import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { NoAuthService } from '../services/no-auth.service';

@Injectable()
export class HttpAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly noAuth: NoAuthService) {
    super();
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.noAuth.enabled) {
      const req = context.switchToHttp().getRequest();
      req.user = this.noAuth.adminUser;
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
