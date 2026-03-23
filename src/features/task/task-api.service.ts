import { Injectable } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import {
  CreateTaskCommand,
  CreateTaskCommandReturnType,
} from './commands/impl/create-task.command';
import {
  UpdateTaskCommand,
  UpdateTaskCommandReturnType,
} from './commands/impl/update-task.command';
import {
  DeleteTaskCommand,
  DeleteTaskCommandReturnType,
} from './commands/impl/delete-task.command';
import { GetTaskQuery, GetTaskQueryReturnType } from './queries/impl/get-task.query';
import { GetTasksQuery, GetTasksQueryReturnType } from './queries/impl/get-tasks.query';
import { TaskCacheService } from 'src/infrastructure/cache/services/task-cache.service';

@Injectable()
export class TaskApiService {
  constructor(
    private readonly commandBus: CommandBus,
    private readonly queryBus: QueryBus,
    private readonly taskCache: TaskCacheService,
  ) {}

  async createTask(data: CreateTaskCommand['data']) {
    return this.commandBus.execute<CreateTaskCommand, CreateTaskCommandReturnType>(
      new CreateTaskCommand(data),
    );
  }

  async updateTask(data: UpdateTaskCommand['data']) {
    return this.commandBus.execute<UpdateTaskCommand, UpdateTaskCommandReturnType>(
      new UpdateTaskCommand(data),
    );
  }

  async deleteTask(data: DeleteTaskCommand['data']) {
    return this.commandBus.execute<DeleteTaskCommand, DeleteTaskCommandReturnType>(
      new DeleteTaskCommand(data),
    );
  }

  async getTask(data: GetTaskQuery['data']) {
    return this.taskCache.task(data.taskId, () =>
      this.queryBus.execute<GetTaskQuery, GetTaskQueryReturnType>(new GetTaskQuery(data)),
    );
  }

  async getTasks(data: GetTasksQuery['data']) {
    return this.taskCache.getTasks([data], () =>
      this.queryBus.execute<GetTasksQuery, GetTasksQueryReturnType>(new GetTasksQuery(data)),
    );
  }
}
