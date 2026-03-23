import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional, MaxLength } from 'class-validator';

const MAX_TITLE_LENGTH = 255;

export class CreateTaskDto {
  @ApiProperty({ description: 'Task title', maxLength: MAX_TITLE_LENGTH })
  @IsString()
  @MaxLength(MAX_TITLE_LENGTH)
  title!: string;

  @ApiProperty({ description: 'Task description', required: false })
  @IsString()
  @IsOptional()
  description?: string;
}
