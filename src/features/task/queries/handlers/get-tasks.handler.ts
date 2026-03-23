import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { GetTasksQuery, GetTasksQueryReturnType } from '../impl/get-tasks.query';

const DEFAULT_PAGE_SIZE = 20;

@QueryHandler(GetTasksQuery)
export class GetTasksHandler implements IQueryHandler<GetTasksQuery, GetTasksQueryReturnType> {
  constructor(private readonly prisma: PrismaService) {}

  async execute({ data }: GetTasksQuery): Promise<GetTasksQueryReturnType> {
    const where: Record<string, unknown> = {};
    if (data.userId) where['userId'] = data.userId;
    if (data.status) where['status'] = data.status;

    const [items, totalCount] = await Promise.all([
      this.prisma.task.findMany({
        where,
        take: data.first || DEFAULT_PAGE_SIZE,
        skip: data.skip || 0,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.task.count({ where }),
    ]);

    return { items, totalCount };
  }
}
