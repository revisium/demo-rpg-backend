import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from 'src/infrastructure/database/database.module';
import { TaskApiService } from './task-api.service';
import { TASK_COMMANDS } from './commands/handlers';
import { TASK_QUERIES } from './queries/handlers';

@Module({
  imports: [CqrsModule, DatabaseModule],
  providers: [TaskApiService, ...TASK_COMMANDS, ...TASK_QUERIES],
  exports: [TaskApiService],
})
export class TaskModule {}
