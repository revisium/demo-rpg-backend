import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

const ACCESS_COOKIE_NAME = 'rev_at';
const REFRESH_COOKIE_NAME = 'rev_rt';
const ACCESS_MAX_AGE_MS = 1800000;
const REFRESH_MAX_AGE_MS = 604800000;

@Injectable()
export class CookieService {
  private readonly isSecure: boolean;

  constructor(private readonly configService: ConfigService) {
    const cookieSecure = this.configService.get('COOKIE_SECURE');
    this.isSecure = cookieSecure
      ? cookieSecure === 'true'
      : this.configService.get('NODE_ENV') === 'production';
  }

  setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
    res.cookie(ACCESS_COOKIE_NAME, accessToken, {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: 'lax',
      path: '/',
      maxAge: ACCESS_MAX_AGE_MS,
    });

    res.cookie(REFRESH_COOKIE_NAME, refreshToken, {
      httpOnly: true,
      secure: this.isSecure,
      sameSite: 'lax',
      path: '/api/auth/refresh',
      maxAge: REFRESH_MAX_AGE_MS,
    });
  }

  clearAuthCookies(res: Response): void {
    res.clearCookie(ACCESS_COOKIE_NAME, { path: '/' });
    res.clearCookie(REFRESH_COOKIE_NAME, { path: '/api/auth/refresh' });
  }
}
