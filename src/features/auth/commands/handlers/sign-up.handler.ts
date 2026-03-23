import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { ConflictException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { SignUpCommand, SignUpCommandReturnType } from '../impl/sign-up.command';

const SALT_ROUNDS = 10;

@CommandHandler(SignUpCommand)
export class SignUpHandler implements ICommandHandler<SignUpCommand, SignUpCommandReturnType> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ data }: SignUpCommand): Promise<SignUpCommandReturnType> {
    const existing = await this.prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(data.password, SALT_ROUNDS);

    const user = await this.prisma.user.create({
      data: {
        email: data.email,
        username: data.username,
        password: hashedPassword,
        roleId: 'user',
      },
    });

    return { id: user.id };
  }
}
