import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

const MAX_PAGE_SIZE = 100;

export class ListRegionsDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(MAX_PAGE_SIZE)
  first?: number;

  @ApiPropertyOptional({ type: String, description: 'Cursor from a previous page' })
  @IsOptional()
  @IsString()
  after?: string;
}
