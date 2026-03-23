import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, Min, Max } from 'class-validator';
import { TaskStatusGql } from '../models/task.model';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

@InputType()
export class GetTasksInput {
  @Field(() => TaskStatusGql, { nullable: true })
  @IsOptional()
  status?: TaskStatusGql;

  @Field(() => Int, { nullable: true, defaultValue: DEFAULT_PAGE_SIZE })
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  first?: number;

  @Field(() => Int, { nullable: true, defaultValue: 0 })
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;
}
