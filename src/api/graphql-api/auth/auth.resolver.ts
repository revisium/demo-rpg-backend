import { Resolver, Query, Mutation, Args, Context } from '@nestjs/graphql';
import { UseGuards, UnauthorizedException } from '@nestjs/common';
import { Response } from 'express';
import { AuthApiService } from 'src/features/auth/services/auth-api.service';
import { CookieService } from 'src/features/auth/services/cookie.service';
import { RefreshTokenService } from 'src/features/auth/services/refresh-token.service';
import { GqlAuthGuard } from 'src/features/auth/guards/gql-auth.guard';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { IAuthUser } from 'src/features/auth/types';
import { LoginResponseModel } from './models/login-response.model';
import { UserModel } from './models/user.model';
import { IdModel } from '../shared/models/id.model';
import { LoginInput } from './inputs/login.input';
import { SignUpInput } from './inputs/sign-up.input';

interface GqlContext {
  req: Request & { cookies?: Record<string, string> };
  res: Response;
}

@Resolver()
export class AuthResolver {
  constructor(
    private readonly authApi: AuthApiService,
    private readonly cookieService: CookieService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Mutation(() => LoginResponseModel)
  async login(@Args('data') data: LoginInput, @Context() ctx: GqlContext) {
    const result = await this.authApi.login({ email: data.email, password: data.password });
    this.cookieService.setAuthCookies(ctx.res, result.accessToken, result.refreshToken);
    return { expiresIn: result.expiresIn, tokenType: 'cookie' };
  }

  @Mutation(() => LoginResponseModel)
  async refreshToken(@Context() ctx: GqlContext) {
    const rawToken = ctx.req.cookies?.rev_rt;
    if (!rawToken) {
      throw new UnauthorizedException('No refresh token');
    }

    const { userId, newToken } = await this.refreshTokenService.rotateToken(rawToken);
    const { accessToken, expiresIn } = await this.authApi.createAccessToken(userId);
    this.cookieService.setAuthCookies(ctx.res, accessToken, newToken);
    return { expiresIn, tokenType: 'cookie' };
  }

  @Mutation(() => Boolean)
  async logout(@Context() ctx: GqlContext) {
    const rawToken = ctx.req.cookies?.rev_rt;
    if (rawToken) {
      await this.refreshTokenService.revokeFamilyByRawToken(rawToken);
    }
    this.cookieService.clearAuthCookies(ctx.res);
    return true;
  }

  @Mutation(() => IdModel)
  async signUp(@Args('data') data: SignUpInput) {
    return this.authApi.signUp({
      email: data.email,
      username: data.username,
      password: data.password,
    });
  }

  @UseGuards(GqlAuthGuard)
  @Query(() => UserModel)
  async me(@CurrentUser() user: IAuthUser) {
    return this.authApi.getMe(user.userId);
  }
}
