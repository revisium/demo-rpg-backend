import { ObjectType, Field, registerEnumType } from '@nestjs/graphql';

export enum TaskStatusGql {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

registerEnumType(TaskStatusGql, { name: 'TaskStatus' });

@ObjectType()
export class TaskModel {
  @Field()
  id!: string;

  @Field()
  title!: string;

  @Field(() => String, { nullable: true })
  description!: string | null;

  @Field(() => TaskStatusGql)
  status!: TaskStatusGql;

  @Field()
  userId!: string;

  @Field()
  createdAt!: Date;

  @Field()
  updatedAt!: Date;
}
