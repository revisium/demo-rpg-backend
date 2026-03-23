import { Injectable } from '@nestjs/common';
import { AbilityBuilder, createMongoAbility, MongoAbility } from '@casl/ability';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { AuthCacheService } from 'src/infrastructure/cache/services/auth-cache.service';

@Injectable()
export class CaslAbilityFactory {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authCache: AuthCacheService,
  ) {}

  async createAbility(roleId: string): Promise<MongoAbility> {
    const { can, build } = new AbilityBuilder(createMongoAbility);

    const permissions = await this.authCache.rolePermissions(roleId, () =>
      this.prisma.permission.findMany({ where: { roleId } }),
    );

    for (const permission of permissions) {
      if (permission.condition) {
        can(permission.action, permission.subject, permission.condition as Record<string, unknown>);
      } else {
        can(permission.action, permission.subject);
      }
    }

    return build();
  }
}
