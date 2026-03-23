import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsInt, Min, Max, IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 100;

enum TaskStatusFilter {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class GetTasksDto {
  @ApiProperty({ description: 'Filter by status', enum: TaskStatusFilter, required: false })
  @IsEnum(TaskStatusFilter)
  @IsOptional()
  status?: TaskStatusFilter;

  @ApiProperty({
    description: 'Number of items to return',
    default: DEFAULT_PAGE_SIZE,
    required: false,
  })
  @Transform(({ value }) => (value === undefined ? DEFAULT_PAGE_SIZE : Number(value)))
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  @IsOptional()
  first?: number;

  @ApiProperty({ description: 'Number of items to skip', default: 0, required: false })
  @Transform(({ value }) => (value === undefined ? 0 : Number(value)))
  @IsInt()
  @Min(0)
  @IsOptional()
  skip?: number;
}
