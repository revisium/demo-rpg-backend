import { Resolver, Query, Mutation, Args } from '@nestjs/graphql';
import { UseGuards } from '@nestjs/common';
import { TaskApiService } from 'src/features/task/task-api.service';
import { GqlAuthGuard } from 'src/features/auth/guards/gql-auth.guard';
import { GqlPermissionGuard } from 'src/features/auth/guards/gql-permission.guard';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { PermissionParams } from 'src/features/auth/decorators/permission-params.decorator';
import { IAuthUser, PermissionAction, PermissionSubject } from 'src/features/auth/types';
import { TaskModel } from './models/task.model';
import { TasksListModel } from './models/tasks-list.model';
import { IdModel } from '../shared/models/id.model';
import { SuccessModel } from '../shared/models/success.model';
import { CreateTaskInput } from './inputs/create-task.input';
import { UpdateTaskInput } from './inputs/update-task.input';
import { GetTasksInput } from './inputs/get-tasks.input';

@UseGuards(GqlAuthGuard)
@PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Task })
@Resolver(() => TaskModel)
export class TaskResolver {
  constructor(private readonly taskApi: TaskApiService) {}

  @UseGuards(GqlPermissionGuard)
  @Query(() => TaskModel)
  async task(@Args('taskId') taskId: string) {
    return this.taskApi.getTask({ taskId });
  }

  @UseGuards(GqlPermissionGuard)
  @Query(() => TasksListModel)
  async tasks(@Args('data', { nullable: true }) data?: GetTasksInput) {
    return this.taskApi.getTasks({
      status: data?.status,
      first: data?.first,
      skip: data?.skip,
    });
  }

  @UseGuards(GqlPermissionGuard)
  @PermissionParams({ action: PermissionAction.create, subject: PermissionSubject.Task })
  @Mutation(() => IdModel)
  async createTask(@Args('data') data: CreateTaskInput, @CurrentUser() user: IAuthUser) {
    return this.taskApi.createTask({
      title: data.title,
      description: data.description,
      userId: user.userId,
    });
  }

  @UseGuards(GqlPermissionGuard)
  @PermissionParams({ action: PermissionAction.update, subject: PermissionSubject.Task })
  @Mutation(() => IdModel)
  async updateTask(@Args('data') data: UpdateTaskInput) {
    return this.taskApi.updateTask({
      taskId: data.taskId,
      title: data.title,
      description: data.description,
      status: data.status,
    });
  }

  @UseGuards(GqlPermissionGuard)
  @PermissionParams({ action: PermissionAction.delete, subject: PermissionSubject.Task })
  @Mutation(() => SuccessModel)
  async deleteTask(@Args('taskId') taskId: string) {
    return this.taskApi.deleteTask({ taskId });
  }
}
