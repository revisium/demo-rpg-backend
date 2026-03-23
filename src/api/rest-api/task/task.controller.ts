import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { TaskApiService } from 'src/features/task/task-api.service';
import { HttpAuthGuard } from 'src/features/auth/guards/http-auth.guard';
import { HttpPermissionGuard } from 'src/features/auth/guards/http-permission.guard';
import { CurrentUser } from 'src/features/auth/decorators/current-user.decorator';
import { PermissionParams } from 'src/features/auth/decorators/permission-params.decorator';
import { IAuthUser, PermissionAction, PermissionSubject } from 'src/features/auth/types';
import { ApiCommonErrors } from '../shared/decorators/api-common.decorators';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { GetTasksDto } from './dto/get-tasks.dto';
import { TaskResponseModel, TasksListResponseModel } from './models/task-response.model';

@ApiTags('Task')
@ApiBearerAuth('access-token')
@UseGuards(HttpAuthGuard)
@PermissionParams({ action: PermissionAction.read, subject: PermissionSubject.Task })
@Controller('api/tasks')
export class TaskController {
  constructor(private readonly taskApi: TaskApiService) {}

  @Get()
  @UseGuards(HttpPermissionGuard)
  @ApiOperation({ summary: 'List tasks' })
  @ApiOkResponse({ type: TasksListResponseModel })
  @ApiCommonErrors()
  async getTasks(@Query() query: GetTasksDto) {
    return this.taskApi.getTasks({
      status: query.status,
      first: query.first,
      skip: query.skip,
    });
  }

  @Get(':taskId')
  @UseGuards(HttpPermissionGuard)
  @ApiOperation({ summary: 'Get task by ID' })
  @ApiOkResponse({ type: TaskResponseModel })
  @ApiCommonErrors()
  async getTask(@Param('taskId') taskId: string) {
    return this.taskApi.getTask({ taskId });
  }

  @Post()
  @UseGuards(HttpPermissionGuard)
  @PermissionParams({ action: PermissionAction.create, subject: PermissionSubject.Task })
  @ApiOperation({ summary: 'Create a new task' })
  @ApiCreatedResponse({ description: 'Task created', type: TaskResponseModel })
  @ApiCommonErrors()
  async createTask(@Body() body: CreateTaskDto, @CurrentUser() user: IAuthUser) {
    return this.taskApi.createTask({
      title: body.title,
      description: body.description,
      userId: user.userId,
    });
  }

  @Patch(':taskId')
  @UseGuards(HttpPermissionGuard)
  @PermissionParams({ action: PermissionAction.update, subject: PermissionSubject.Task })
  @ApiOperation({ summary: 'Update a task' })
  @ApiOkResponse({ type: TaskResponseModel })
  @ApiCommonErrors()
  async updateTask(@Param('taskId') taskId: string, @Body() body: UpdateTaskDto) {
    return this.taskApi.updateTask({
      taskId,
      title: body.title,
      description: body.description,
      status: body.status,
    });
  }

  @Delete(':taskId')
  @UseGuards(HttpPermissionGuard)
  @PermissionParams({ action: PermissionAction.delete, subject: PermissionSubject.Task })
  @ApiOperation({ summary: 'Delete a task' })
  @ApiOkResponse({ description: 'Task deleted' })
  @ApiCommonErrors()
  async deleteTask(@Param('taskId') taskId: string) {
    return this.taskApi.deleteTask({ taskId });
  }
}
