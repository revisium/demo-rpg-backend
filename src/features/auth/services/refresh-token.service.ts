import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { nanoid } from 'nanoid';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

const TOKEN_PREFIX = 'ref_';
const TOKEN_BYTE_LENGTH = 36;
const DEFAULT_REFRESH_TTL_DAYS = 7;
const DEFAULT_GRACE_PERIOD_MS = 30000;
const MS_PER_DAY = 86400000;

@Injectable()
export class RefreshTokenService {
  private readonly refreshTtlMs: number;
  private readonly gracePeriodMs: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    const ttlDays =
      Number(this.configService.get('JWT_REFRESH_TOKEN_TTL_DAYS')) || DEFAULT_REFRESH_TTL_DAYS;
    this.refreshTtlMs = ttlDays * MS_PER_DAY;
    this.gracePeriodMs =
      Number(this.configService.get('JWT_REFRESH_GRACE_PERIOD_MS')) || DEFAULT_GRACE_PERIOD_MS;
  }

  async createToken(userId: string, familyId?: string): Promise<string> {
    const token = `${TOKEN_PREFIX}${randomBytes(TOKEN_BYTE_LENGTH).toString('hex')}`;
    const tokenHash = createHash('sha256').update(token).digest('hex');
    const family = familyId || nanoid();

    await this.prisma.refreshToken.create({
      data: {
        tokenHash,
        userId,
        familyId: family,
        expiresAt: new Date(Date.now() + this.refreshTtlMs),
      },
    });

    return token;
  }

  async rotateToken(rawToken: string): Promise<{ userId: string; newToken: string }> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const storedToken = await this.prisma.refreshToken.findUnique({
      where: { tokenHash },
    });

    if (!storedToken) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    if (storedToken.revokedAt) {
      return this.handleRevokedToken(storedToken);
    }

    if (storedToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Refresh token expired');
    }

    await this.prisma.refreshToken.update({
      where: { id: storedToken.id },
      data: { revokedAt: new Date() },
    });

    const newToken = await this.createToken(storedToken.userId, storedToken.familyId);
    return { userId: storedToken.userId, newToken };
  }

  async revokeFamily(familyId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { familyId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async revokeFamilyByRawToken(rawToken: string): Promise<void> {
    const tokenHash = createHash('sha256').update(rawToken).digest('hex');
    const stored = await this.prisma.refreshToken.findUnique({ where: { tokenHash } });
    if (stored) {
      await this.revokeFamily(stored.familyId);
    }
  }

  async revokeAllUserTokens(userId: string): Promise<void> {
    await this.prisma.refreshToken.updateMany({
      where: { userId, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  private async handleRevokedToken(storedToken: {
    id: string;
    familyId: string;
    revokedAt: Date | null;
    userId: string;
  }): Promise<{ userId: string; newToken: string }> {
    const elapsed = Date.now() - storedToken.revokedAt!.getTime();

    if (elapsed <= this.gracePeriodMs) {
      const latestToken = await this.prisma.refreshToken.findFirst({
        where: { familyId: storedToken.familyId, revokedAt: null },
        orderBy: { createdAt: 'desc' },
      });

      if (latestToken) {
        await this.prisma.refreshToken.update({
          where: { id: latestToken.id },
          data: { revokedAt: new Date() },
        });

        const newToken = await this.createToken(latestToken.userId, latestToken.familyId);
        return { userId: latestToken.userId, newToken };
      }
    }

    await this.revokeFamily(storedToken.familyId);
    throw new UnauthorizedException('Refresh token reuse detected');
  }
}
