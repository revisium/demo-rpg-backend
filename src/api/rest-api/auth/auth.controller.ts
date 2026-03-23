import {
  Controller,
  Post,
  Get,
  Body,
  Req,
  Res,
  UseGuards,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
} from '@nestjs/swagger';
import { Request, Response } from 'express';
import { CookieService } from 'src/features/auth/services/cookie.service';
import { RefreshTokenService } from 'src/features/auth/services/refresh-token.service';
import { AuthApiService } from 'src/features/auth/services/auth-api.service';
import { HttpAuthGuard } from 'src/features/auth/guards/http-auth.guard';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { IAuthUser } from 'src/features/auth/types';
import { ApiCommonErrors } from '../shared/decorators/api-common.decorators';
import { LoginDto } from './dto/login.dto';
import { SignUpDto } from './dto/sign-up.dto';

type RequestWithCookies = Request & { cookies?: Record<string, string> };

@ApiTags('Auth')
@Controller('api/auth')
export class AuthController {
  constructor(
    private readonly authApi: AuthApiService,
    private readonly cookieService: CookieService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  @Post('login')
  @ApiOperation({ summary: 'Login with email and password' })
  @ApiOkResponse({
    description: 'Sets httpOnly cookies with access and refresh tokens',
  })
  @ApiCommonErrors()
  async login(@Body() body: LoginDto, @Res({ passthrough: true }) res: Response) {
    const result = await this.authApi.login({
      email: body.email,
      password: body.password,
    });
    this.cookieService.setAuthCookies(res, result.accessToken, result.refreshToken);
    return { expiresIn: result.expiresIn, tokenType: 'cookie' };
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Refresh access token using refresh token cookie' })
  @ApiOkResponse({ description: 'Tokens refreshed' })
  @ApiCommonErrors()
  async refresh(@Req() req: RequestWithCookies, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.rev_rt;
    if (!refreshToken) {
      this.cookieService.clearAuthCookies(res);
      throw new UnauthorizedException('No refresh token');
    }

    const { userId, newToken } = await this.refreshTokenService.rotateToken(refreshToken);
    const { accessToken, expiresIn } = await this.authApi.createAccessToken(userId);

    this.cookieService.setAuthCookies(res, accessToken, newToken);
    return { expiresIn, tokenType: 'cookie' };
  }

  @Post('logout')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Logout and clear auth cookies' })
  @ApiNoContentResponse({ description: 'Logged out' })
  async logout(@Req() req: RequestWithCookies, @Res({ passthrough: true }) res: Response) {
    const refreshToken = req.cookies?.rev_rt;
    if (refreshToken) {
      await this.refreshTokenService.revokeFamilyByRawToken(refreshToken);
    }
    this.cookieService.clearAuthCookies(res);
  }

  @Post('sign-up')
  @ApiOperation({ summary: 'Register a new user' })
  @ApiCreatedResponse({ description: 'User created' })
  @ApiCommonErrors()
  async signUp(@Body() body: SignUpDto) {
    return this.authApi.signUp({
      email: body.email,
      username: body.username,
      password: body.password,
    });
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @UseGuards(HttpAuthGuard)
  @ApiOperation({ summary: 'Get current user info' })
  @ApiOkResponse({ description: 'Current user data' })
  @ApiCommonErrors()
  async me(@CurrentUser() user: IAuthUser) {
    return this.authApi.getMe(user.userId);
  }
}
