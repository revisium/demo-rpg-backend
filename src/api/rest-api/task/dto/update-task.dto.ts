import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, MaxLength } from 'class-validator';

const MAX_TITLE_LENGTH = 255;

enum TaskStatusDto {
  PENDING = 'PENDING',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

export class UpdateTaskDto {
  @ApiProperty({ description: 'Task title', required: false, maxLength: MAX_TITLE_LENGTH })
  @IsString()
  @IsOptional()
  @MaxLength(MAX_TITLE_LENGTH)
  title?: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Task status', enum: TaskStatusDto, required: false })
  @IsEnum(TaskStatusDto)
  @IsOptional()
  status?: TaskStatusDto;
}
