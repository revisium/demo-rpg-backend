import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Request } from 'express';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { getRequiredEnv } from 'src/shared/config/env';
import { IAuthUser } from '../types';

const BEARER_PREFIX = 'Bearer ';

function extractTokenFromCookieOrHeader(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader?.startsWith(BEARER_PREFIX)) {
    return authHeader.slice(BEARER_PREFIX.length);
  }
  return (req as Request & { cookies?: Record<string, string> }).cookies?.rev_at ?? null;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([extractTokenFromCookieOrHeader]),
      ignoreExpiration: false,
      secretOrKey: getRequiredEnv('JWT_SECRET'),
    });
  }

  async validate(payload: {
    sub: string;
    email: string;
    username: string;
    roleId: string;
    ver?: number;
  }): Promise<IAuthUser> {
    if (!payload.sub || !payload.email || !payload.username || !payload.roleId) {
      throw new UnauthorizedException();
    }

    if (payload.ver !== undefined) {
      const user = await this.prisma.user.findUnique({
        where: { id: payload.sub },
        select: { tokenVersion: true },
      });

      if (user?.tokenVersion !== payload.ver) {
        throw new UnauthorizedException('Token revoked');
      }
    }

    return {
      userId: payload.sub,
      email: payload.email,
      username: payload.username,
      roleId: payload.roleId,
    };
  }
}
