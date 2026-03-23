import { InputType, Field } from '@nestjs/graphql';
import { IsString, IsOptional, MaxLength } from 'class-validator';
import { TaskStatusGql } from '../models/task.model';

const MAX_TITLE_LENGTH = 255;

@InputType()
export class UpdateTaskInput {
  @Field()
  @IsString()
  taskId!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @MaxLength(MAX_TITLE_LENGTH)
  @IsOptional()
  title?: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;

  @Field(() => TaskStatusGql, { nullable: true })
  @IsOptional()
  status?: TaskStatusGql;
}
