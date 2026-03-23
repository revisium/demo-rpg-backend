import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { getRequiredEnv } from 'src/shared/config/env';
import { LoginCommand, LoginCommandReturnType } from '../commands/impl/login.command';
import { SignUpCommand, SignUpCommandReturnType } from '../commands/impl/sign-up.command';
import { GetMeQuery, GetMeQueryReturnType } from '../queries/impl/get-me.query';

const ACCESS_TOKEN_TTL = '30m';
const ACCESS_TOKEN_EXPIRES_IN_SECONDS = 1800;

@Injectable()
export class AuthApiService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly jwtService: JwtService,
    private readonly prisma: PrismaService,
  ) {}

  async login(data: { email: string; password: string }) {
    return this.commandBus.execute<LoginCommand, LoginCommandReturnType>(new LoginCommand(data));
  }

  async signUp(data: { email: string; username: string; password: string }) {
    return this.commandBus.execute<SignUpCommand, SignUpCommandReturnType>(new SignUpCommand(data));
  }

  async getMe(userId: string) {
    return this.queryBus.execute<GetMeQuery, GetMeQueryReturnType>(new GetMeQuery({ userId }));
  }

  async createAccessToken(userId: string): Promise<{ accessToken: string; expiresIn: number }> {
    const user = await this.prisma.user.findUniqueOrThrow({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        username: true,
        roleId: true,
        tokenVersion: true,
      },
    });

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
    return { accessToken, expiresIn: ACCESS_TOKEN_EXPIRES_IN_SECONDS };
  }
}
