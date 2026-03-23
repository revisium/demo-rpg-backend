import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/infrastructure/database/prisma.service';
import { UpdateTaskCommand, UpdateTaskCommandReturnType } from '../impl/update-task.command';
import { TaskUpdatedEvent } from '../../events/impl/task-updated.event';

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<
  UpdateTaskCommand,
  UpdateTaskCommandReturnType
> {
  constructor(
    private readonly prisma: PrismaService,
    private readonly eventBus: EventBus,
  ) {}

  async execute({ data }: UpdateTaskCommand): Promise<UpdateTaskCommandReturnType> {
    const existing = await this.prisma.task.findUnique({
      where: { id: data.taskId },
    });

    if (!existing) {
      throw new NotFoundException('Task not found');
    }

    await this.prisma.task.update({
      where: { id: data.taskId },
      data: {
        ...(data.title !== undefined && { title: data.title }),
        ...(data.description !== undefined && { description: data.description }),
        ...(data.status !== undefined && { status: data.status }),
      },
    });

    this.eventBus.publish(new TaskUpdatedEvent(data.taskId));

    return { id: data.taskId };
  }
}
