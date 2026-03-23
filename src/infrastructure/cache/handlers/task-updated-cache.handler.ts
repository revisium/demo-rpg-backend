import { EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { TaskUpdatedEvent } from 'src/features/task/events/impl/task-updated.event';
import { TaskCacheService } from '../services/task-cache.service';

@EventsHandler(TaskUpdatedEvent)
export class TaskUpdatedCacheHandler implements IEventHandler<TaskUpdatedEvent> {
  constructor(private readonly taskCache: TaskCacheService) {}

  async handle(event: TaskUpdatedEvent) {
    await this.taskCache.invalidateTask(event.taskId);
    await this.taskCache.invalidateGetTasks();
  }
}
