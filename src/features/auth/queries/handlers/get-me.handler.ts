import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { GetMeQuery, GetMeQueryReturnType } from '../impl/get-me.query';

@QueryHandler(GetMeQuery)
export class GetMeHandler implements IQueryHandler<GetMeQuery, GetMeQueryReturnType> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ data }: GetMeQuery): Promise<GetMeQueryReturnType> {
    const user = await this.prisma.user.findUnique({
      where: { id: data.userId },
      select: { id: true, email: true, username: true, roleId: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }
}
