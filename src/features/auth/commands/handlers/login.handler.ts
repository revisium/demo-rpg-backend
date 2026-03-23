import { UnauthorizedException } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { getRequiredEnv } from 'src/shared/config/env';
import { RefreshTokenService } from '../../services/refresh-token.service';
import { LoginCommand, LoginCommandReturnType } from '../impl/login.command';

const ACCESS_TOKEN_TTL = '30m';
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 1800;

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand, LoginCommandReturnType> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly refreshTokenService: RefreshTokenService,
  ) {}

  async execute({ data }: LoginCommand): Promise<LoginCommandReturnType> {
    const user = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(data.password, user.password);
    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: user.id,
      email: user.email,
      username: user.username,
      roleId: user.roleId,
      ver: user.tokenVersion,
    };

    const secret = getRequiredEnv('JWT_SECRET');
    const accessToken = this.jwtService.sign(payload, {
      secret,
      expiresIn: ACCESS_TOKEN_TTL,
    });
    const refreshToken = await this.refreshTokenService.createToken(user.id);

    return {
      accessToken,
      refreshToken,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS,
    };
  }
}
