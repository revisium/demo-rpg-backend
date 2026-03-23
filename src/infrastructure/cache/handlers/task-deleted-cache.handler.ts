import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskDeletedEvent } from 'src/features/task/events/impl/task-deleted.event';
import { TaskCacheService } from '../services/task-cache.service';

@EventsHandler(TaskDeletedEvent)
export class TaskDeletedCacheHandler implements IEventHandler<TaskDeletedEvent> {
  constructor(private readonly taskCache: TaskCacheService) {}

  async handle(event: TaskDeletedEvent) {
    await this.taskCache.invalidateTask(event.taskId);
    await this.taskCache.invalidateGetTasks();
  }
}
