import { Injectable, UnauthorizedException } from '@nestjs/common';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from 'src/infrastructure/database/prisma.service';

const TOKEN_BYTE_LENGTH = 36;
const MS_PER_SECOND = 1000;
const SECONDS_PER_MINUTE = 60;
const MINUTES_PER_HOUR = 60;
const HOURS_PER_DAY = 24;
const DEFAULT_ACCESS_TOKEN_EXPIRY_HOURS = 1;
const MCP_ACCESS_TOKEN_EXPIRY_DAYS = 30;
const DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS = 30;
const MCP_REFRESH_TOKEN_EXPIRY_DAYS = 90;

export interface OAuthTokenPair {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
  tokenType: string;
}

export interface OAuthTokenUser {
  userId: string;
  username: string;
  email: string;
  roleId: string;
  scope: string | null;
}

@Injectable()
export class OAuthTokenService {
  constructor(private readonly prisma: PrismaService) {}

  async createTokens(
    clientId: string,
    userId: string,
    scope?: string | null,
  ): Promise<OAuthTokenPair> {
    const isMcp = scope === 'mcp';

    const accessToken = `oat_${randomBytes(TOKEN_BYTE_LENGTH).toString('hex')}`;
    const refreshToken = `ort_${randomBytes(TOKEN_BYTE_LENGTH).toString('hex')}`;

    const accessTokenHash = createHash('sha256').update(accessToken).digest('hex');
    const refreshTokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const accessExpiryMs = isMcp
      ? this.getMcpAccessTokenExpiryMs()
      : DEFAULT_ACCESS_TOKEN_EXPIRY_HOURS * MINUTES_PER_HOUR * SECONDS_PER_MINUTE * MS_PER_SECOND;
    const refreshExpiryMs = isMcp
      ? MCP_REFRESH_TOKEN_EXPIRY_DAYS *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MS_PER_SECOND
      : DEFAULT_REFRESH_TOKEN_EXPIRY_DAYS *
        HOURS_PER_DAY *
        MINUTES_PER_HOUR *
        SECONDS_PER_MINUTE *
        MS_PER_SECOND;

    await this.prisma.oAuthAccessToken.create({
      data: {
        tokenHash: accessTokenHash,
        scope,
        expiresAt: new Date(Date.now() + accessExpiryMs),
        clientId,
        userId,
      },
    });

    await this.prisma.oAuthRefreshToken.create({
      data: {
        tokenHash: refreshTokenHash,
        scope,
        expiresAt: new Date(Date.now() + refreshExpiryMs),
        clientId,
        userId,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: Math.floor(accessExpiryMs / MS_PER_SECOND),
      tokenType: 'Bearer',
    };
  }

  async validateAccessToken(token: string): Promise<OAuthTokenUser> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    const accessToken = await this.prisma.oAuthAccessToken.findUnique({
      where: { tokenHash },
      include: { user: { select: { id: true, username: true, email: true, roleId: true } } },
    });

    if (!accessToken) {
      throw new UnauthorizedException('Invalid access token');
    }

    if (accessToken.revokedAt) {
      throw new UnauthorizedException('Token has been revoked');
    }

    if (accessToken.expiresAt < new Date()) {
      throw new UnauthorizedException('Token has expired');
    }

    return {
      userId: accessToken.user.id,
      username: accessToken.user.username,
      email: accessToken.user.email,
      roleId: accessToken.user.roleId,
      scope: accessToken.scope,
    };
  }

  async refreshTokens(refreshToken: string, clientId: string): Promise<OAuthTokenPair> {
    const tokenHash = createHash('sha256').update(refreshToken).digest('hex');

    const token = await this.prisma.oAuthRefreshToken.findUnique({
      where: { tokenHash },
    });

    if (token?.clientId !== clientId || token.revokedAt || token.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.oAuthRefreshToken.update({
      where: { id: token.id },
      data: { revokedAt: new Date() },
    });

    return this.createTokens(clientId, token.userId, token.scope);
  }

  async revokeToken(token: string, tokenTypeHint?: string, clientId?: string): Promise<void> {
    const tokenHash = createHash('sha256').update(token).digest('hex');

    if (tokenTypeHint === 'refresh_token' || token.startsWith('ort_')) {
      const refreshToken = await this.prisma.oAuthRefreshToken.findUnique({
        where: { tokenHash },
      });
      if (refreshToken && (!clientId || refreshToken.clientId === clientId)) {
        await this.prisma.oAuthRefreshToken.update({
          where: { id: refreshToken.id },
          data: { revokedAt: new Date() },
        });
        await this.prisma.oAuthAccessToken.updateMany({
          where: { clientId: refreshToken.clientId, userId: refreshToken.userId, revokedAt: null },
          data: { revokedAt: new Date() },
        });
      }
      return;
    }

    const accessToken = await this.prisma.oAuthAccessToken.findUnique({
      where: { tokenHash },
    });
    if (accessToken && (!clientId || accessToken.clientId === clientId)) {
      await this.prisma.oAuthAccessToken.update({
        where: { id: accessToken.id },
        data: { revokedAt: new Date() },
      });
    }
  }

  private getMcpAccessTokenExpiryMs(): number {
    const envDays = process.env['MCP_ACCESS_TOKEN_EXPIRY_DAYS'];
    const days = envDays ? Number.parseInt(envDays, 10) : MCP_ACCESS_TOKEN_EXPIRY_DAYS;
    return (
      (days > 0 ? days : MCP_ACCESS_TOKEN_EXPIRY_DAYS) *
      HOURS_PER_DAY *
      MINUTES_PER_HOUR *
      SECONDS_PER_MINUTE *
      MS_PER_SECOND
    );
  }
}
