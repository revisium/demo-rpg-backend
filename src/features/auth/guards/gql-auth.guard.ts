import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { NoAuthService } from '../services/no-auth.service';

@Injectable()
export class GqlAuthGuard extends AuthGuard('jwt') {
  constructor(private readonly noAuth: NoAuthService) {
    super();
  }

  getRequest(context: ExecutionContext) {
    const ctx = GqlExecutionContext.create(context);
    return ctx.getContext().req;
  }

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (this.noAuth.enabled) {
      const req = this.getRequest(context);
      req.user = this.noAuth.adminUser;
      return true;
    }
    return super.canActivate(context) as Promise<boolean>;
  }
}
