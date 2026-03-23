import {
  Controller,
  Post,
  Get,
  Body,
  Query,
  Req,
  Res,
  BadRequestException,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiExcludeController } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { OAuthClientService } from './oauth-client.service';
import { OAuthAuthorizationService } from './oauth-authorization.service';
import { OAuthTokenService } from './oauth-token.service';
import { IAuthUser } from 'src/features/auth/types';

class AuthorizeQueryDto {
  client_id!: string;
  redirect_uri!: string;
  code_challenge!: string;
  code_challenge_method!: string;
  response_type!: string;
  state!: string;
  scope!: string;
}

@ApiExcludeController()
@Controller()
export class OAuthController {
  constructor(
    private readonly clientService: OAuthClientService,
    private readonly authorizationService: OAuthAuthorizationService,
    private readonly tokenService: OAuthTokenService,
  ) {}

  @Get('.well-known/oauth-authorization-server')
  getAuthorizationServerMetadata() {
    const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:8080';
    return {
      issuer: publicUrl,
      authorization_endpoint: `${publicUrl}/oauth/authorize`,
      token_endpoint: `${publicUrl}/oauth/token`,
      registration_endpoint: `${publicUrl}/oauth/register`,
      revocation_endpoint: `${publicUrl}/oauth/revoke`,
      response_types_supported: ['code'],
      grant_types_supported: ['authorization_code', 'refresh_token'],
      code_challenge_methods_supported: ['S256'],
      token_endpoint_auth_methods_supported: ['client_secret_post'],
      scopes_supported: ['mcp'],
    };
  }

  @Get('.well-known/oauth-protected-resource')
  getProtectedResourceMetadata() {
    const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:8080';
    return {
      resource: publicUrl,
      authorization_servers: [publicUrl],
      bearer_methods_supported: ['header'],
      scopes_supported: ['mcp'],
    };
  }

  @Post('oauth/register')
  async registerClient(
    @Body() body: { client_name: string; redirect_uris: string[]; grant_types?: string[] },
  ) {
    if (!body.client_name || !body.redirect_uris?.length) {
      throw new BadRequestException('client_name and redirect_uris are required');
    }

    const result = await this.clientService.registerClient({
      clientName: body.client_name,
      redirectUris: body.redirect_uris,
      grantTypes: body.grant_types,
    });

    return {
      client_id: result.clientId,
      client_secret: result.clientSecret,
      client_name: result.clientName,
      redirect_uris: result.redirectUris,
      grant_types: result.grantTypes,
    };
  }

  @Get('oauth/authorize')
  async authorizeGet(@Query() query: AuthorizeQueryDto, @Res() res: Response) {
    if (query.response_type !== 'code') {
      throw new BadRequestException('response_type must be "code"');
    }
    if (query.code_challenge_method !== 'S256') {
      throw new BadRequestException('code_challenge_method must be "S256"');
    }

    const client = await this.clientService.findClient(query.client_id);
    if (!client) {
      throw new BadRequestException('Unknown client_id');
    }
    if (!client.redirectUris.includes(query.redirect_uri)) {
      throw new BadRequestException('Invalid redirect_uri');
    }

    const publicUrl = process.env['PUBLIC_URL'] || 'http://localhost:8080';
    const params = new URLSearchParams({
      client_id: query.client_id,
      client_name: client.clientName,
      redirect_uri: query.redirect_uri,
      code_challenge: query.code_challenge,
      state: query.state || '',
      scope: query.scope || '',
    });
    res.redirect(`${publicUrl}/authorize?${params.toString()}`);
  }

  @Post('oauth/authorize')
  async authorizePost(
    @Body()
    body: {
      client_id: string;
      redirect_uri: string;
      code_challenge: string;
      state?: string;
      scope?: string;
    },
    @Req() req: Request,
  ) {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new UnauthorizedException('Bearer token required');
    }

    const user = (req as Request & { user?: IAuthUser }).user;
    if (!user) {
      throw new UnauthorizedException('Authentication required');
    }

    const code = await this.authorizationService.createAuthorizationCode({
      clientId: body.client_id,
      userId: user.userId,
      redirectUri: body.redirect_uri,
      codeChallenge: body.code_challenge,
      scope: body.scope,
    });

    const url = new URL(body.redirect_uri);
    url.searchParams.set('code', code);
    if (body.state) url.searchParams.set('state', body.state);

    return { redirect_uri: url.toString() };
  }

  @Post('oauth/token')
  async token(
    @Body()
    body: {
      grant_type: string;
      code?: string;
      client_id: string;
      client_secret: string;
      code_verifier?: string;
      redirect_uri?: string;
      refresh_token?: string;
    },
  ) {
    const isValidClient = await this.clientService.validateClientSecret(
      body.client_id,
      body.client_secret,
    );
    if (!isValidClient) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    if (body.grant_type === 'authorization_code') {
      if (!body.code || !body.code_verifier || !body.redirect_uri) {
        throw new BadRequestException('code, code_verifier, and redirect_uri are required');
      }

      const { userId, scope } = await this.authorizationService.exchangeCode({
        code: body.code,
        clientId: body.client_id,
        codeVerifier: body.code_verifier,
        redirectUri: body.redirect_uri,
      });

      const tokens = await this.tokenService.createTokens(body.client_id, userId, scope);
      return {
        access_token: tokens.accessToken,
        token_type: tokens.tokenType,
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
      };
    }

    if (body.grant_type === 'refresh_token') {
      if (!body.refresh_token) {
        throw new BadRequestException('refresh_token is required');
      }

      const tokens = await this.tokenService.refreshTokens(body.refresh_token, body.client_id);
      return {
        access_token: tokens.accessToken,
        token_type: tokens.tokenType,
        expires_in: tokens.expiresIn,
        refresh_token: tokens.refreshToken,
      };
    }

    throw new BadRequestException('Unsupported grant_type');
  }

  @Post('oauth/revoke')
  async revoke(
    @Body()
    body: {
      token: string;
      token_type_hint?: string;
      client_id: string;
      client_secret: string;
    },
  ) {
    const isValidClient = await this.clientService.validateClientSecret(
      body.client_id,
      body.client_secret,
    );
    if (!isValidClient) {
      throw new UnauthorizedException('Invalid client credentials');
    }

    await this.tokenService.revokeToken(body.token, body.token_type_hint, body.client_id);
    return {};
  }
}
