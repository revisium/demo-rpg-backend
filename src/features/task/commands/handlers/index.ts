import { CreateTaskHandler } from './create-task.handler';
import { UpdateTaskHandler } from './update-task.handler';
import { DeleteTaskHandler } from './delete-task.handler';

export const TASK_COMMANDS = [CreateTaskHandler, UpdateTaskHandler, DeleteTaskHandler];
