import { CanActivate, ExecutionContext, ForbiddenException, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { CaslAbilityFactory } from '../casl-ability.factory';
import { IAuthUser, IPermissionParams } from '../types';
import { PERMISSION_PARAMS_KEY } from '../decorators/permission-params.decorator';

@Injectable()
export class HttpPermissionGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly caslAbilityFactory: CaslAbilityFactory,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permissions = this.reflector.getAllAndOverride<IPermissionParams[]>(
      PERMISSION_PARAMS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!permissions || permissions.length === 0) {
      return true;
    }

    const req = context.switchToHttp().getRequest();
    const user = req.user as IAuthUser | undefined;

    if (!user) {
      throw new ForbiddenException('No authenticated user');
    }

    const ability = await this.caslAbilityFactory.createAbility(user.roleId);

    for (const permission of permissions) {
      if (!ability.can(permission.action, permission.subject)) {
        throw new ForbiddenException(
          `Insufficient permissions: ${permission.action} ${permission.subject}`,
        );
      }
    }

    return true;
  }
}
