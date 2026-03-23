import { INestApplication } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { getRequiredEnv } from 'src/shared/config/env';

export function generateTestToken(
  app: INestApplication,
  payload: { userId: string; email: string; username: string; roleId: string },
): string {
  const jwtService = app.get(JwtService);
  return jwtService.sign(
    {
      sub: payload.userId,
      email: payload.email,
      username: payload.username,
      roleId: payload.roleId,
    },
    { secret: getRequiredEnv('JWT_SECRET'), expiresIn: '1h' },
  );
}
