import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

const CODE_BYTE_LENGTH = 24;
const CODE_EXPIRY_MINUTES = 10;
const SECONDS_PER_MINUTE = 60;
const MS_PER_SECOND = 1000;

@Injectable()
export class OAuthAuthorizationService {
  constructor(private readonly prisma: PrismaService) {}

  async createAuthorizationCode(data: {
    clientId: string;
    userId: string;
    redirectUri: string;
    codeChallenge: string;
    scope?: string;
  }): Promise<string> {
    const code = `auth_${randomBytes(CODE_BYTE_LENGTH).toString('hex')}`;
    const expiresAt = new Date(
      Date.now() + CODE_EXPIRY_MINUTES * SECONDS_PER_MINUTE * MS_PER_SECOND,
    );

    await this.prisma.oAuthAuthorizationCode.create({
      data: {
        code,
        codeChallenge: data.codeChallenge,
        redirectUri: data.redirectUri,
        scope: data.scope,
        expiresAt,
        clientId: data.clientId,
        userId: data.userId,
      },
    });

    return code;
  }

  async exchangeCode(data: {
    code: string;
    clientId: string;
    codeVerifier: string;
    redirectUri: string;
  }): Promise<{ userId: string; scope: string | null }> {
    const result = await this.prisma.oAuthAuthorizationCode.updateMany({
      where: {
        code: data.code,
        clientId: data.clientId,
        redirectUri: data.redirectUri,
        usedAt: null,
        expiresAt: { gt: new Date() },
      },
      data: { usedAt: new Date() },
    });

    if (result.count === 0) {
      throw new UnauthorizedException('Invalid or expired authorization code');
    }

    const authCode = await this.prisma.oAuthAuthorizationCode.findUnique({
      where: { code: data.code },
    });

    if (!authCode || !this.verifyPkce(data.codeVerifier, authCode.codeChallenge)) {
      throw new UnauthorizedException('PKCE verification failed');
    }

    return { userId: authCode.userId, scope: authCode.scope };
  }

  private verifyPkce(codeVerifier: string, codeChallenge: string): boolean {
    const computed = createHash('sha256').update(codeVerifier).digest('base64url');
    const a = Buffer.from(computed);
    const b = Buffer.from(codeChallenge);
    return a.length === b.length && timingSafeEqual(a, b);
  }
}
