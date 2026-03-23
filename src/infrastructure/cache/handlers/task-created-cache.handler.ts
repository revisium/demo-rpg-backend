import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskCreatedEvent } from 'src/features/task/events/impl/task-created.event';
import { TaskCacheService } from '../services/task-cache.service';

@EventsHandler(TaskCreatedEvent)
export class TaskCreatedCacheHandler implements IEventHandler<TaskCreatedEvent> {
  constructor(private readonly taskCache: TaskCacheService) {}

  async handle(_event: TaskCreatedEvent) {
    await this.taskCache.invalidateGetTasks();
  }
}
