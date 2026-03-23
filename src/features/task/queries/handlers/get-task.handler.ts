import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { GetTaskQuery, GetTaskQueryReturnType } from '../impl/get-task.query';

@QueryHandler(GetTaskQuery)
export class GetTaskHandler implements IQueryHandler<GetTaskQuery, GetTaskQueryReturnType> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ data }: GetTaskQuery): Promise<GetTaskQueryReturnType> {
    const task = await this.prisma.task.findUnique({
      where: { id: data.taskId },
    });

    if (!task) {
      throw new NotFoundException('Task not found');
    }

    return task;
  }
}
