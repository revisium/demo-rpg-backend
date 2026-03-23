import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Request } from 'express';
import { OAuthTokenService } from 'src/features/oauth/oauth-token.service';
import { NoAuthService } from 'src/features/auth/services/no-auth.service';
import { McpUserContext } from './types';

const BEARER_PREFIX_LENGTH = 7;

@Injectable()
export class McpAuthService {
  constructor(
    private readonly jwtService: JwtService,
    private readonly oauthTokenService: OAuthTokenService,
    private readonly noAuth: NoAuthService,
  ) {}

  async extractUserContext(req: Request): Promise<McpUserContext> {
    if (this.noAuth.enabled) {
      return {
        userId: this.noAuth.adminUser.userId,
        username: this.noAuth.adminUser.username,
        email: this.noAuth.adminUser.email,
        roleId: this.noAuth.adminUser.roleId,
      };
    }

    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const token = authHeader.slice(BEARER_PREFIX_LENGTH);

    if (token.startsWith('oat_')) {
      return this.validateOAuthToken(token);
    }

    return this.validateJwt(token);
  }

  private async validateOAuthToken(token: string): Promise<McpUserContext> {
    const tokenData = await this.oauthTokenService.validateAccessToken(token);
    if (tokenData.scope !== 'mcp') {
      throw new UnauthorizedException('Token scope must be "mcp"');
    }
    return {
      userId: tokenData.userId,
      username: tokenData.username,
      email: tokenData.email,
      roleId: tokenData.roleId,
    };
  }

  private validateJwt(token: string): McpUserContext {
    try {
      const secret = process.env['JWT_SECRET'];
      const payload = this.jwtService.verify(token, { secret });
      return {
        userId: payload.sub,
        username: payload.username,
        email: payload.email,
        roleId: payload.roleId,
      };
    } catch {
      throw new UnauthorizedException('Invalid JWT token');
    }
  }
}
