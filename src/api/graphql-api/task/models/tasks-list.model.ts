import { ObjectType, Field, Int } from '@nestjs/graphql';
import { TaskModel } from './task.model';

@ObjectType()
export class TasksListModel {
  @Field(() => [TaskModel])
  items!: TaskModel[];

  @Field(() => Int)
  totalCount!: number;
}
