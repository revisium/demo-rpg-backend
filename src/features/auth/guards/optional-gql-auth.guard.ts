import { ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthGuard } from '@nestjs/passport';
import { NoAuthService } from '../services/no-auth.service';

@Injectable()
export class OptionalGqlAuthGuard extends AuthGuard('jwt') {
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
    try {
      return await (super.canActivate(context) as Promise<boolean>);
    } catch {
      return true;
    }
  }
}
