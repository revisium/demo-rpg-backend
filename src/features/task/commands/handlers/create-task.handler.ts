import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { CreateTaskCommand, CreateTaskCommandReturnType } from '../impl/create-task.command';
import { TaskCreatedEvent } from '../../events/impl/task-created.event';

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<
  CreateTaskCommand,
  CreateTaskCommandReturnType
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ data }: CreateTaskCommand): Promise<CreateTaskCommandReturnType> {
    const task = await this.prisma.task.create({
      data: {
        title: data.title,
        description: data.description,
        userId: data.userId,
      },
    });

    this.eventBus.publish(new TaskCreatedEvent(task.id, data.userId));

    return { id: task.id };
  }
}
