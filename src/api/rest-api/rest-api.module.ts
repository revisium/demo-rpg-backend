import { Module } from '@nestjs/common';
import { AuthModule } from 'src/features/auth/auth.module';
import { TaskModule } from 'src/features/task/task.module';
import { TaskController } from './task/task.controller';
import { AuthController } from './auth/auth.controller';

@Module({
  imports: [AuthModule, TaskModule],
  controllers: [TaskController, AuthController],
})
export class RestApiModule {}
