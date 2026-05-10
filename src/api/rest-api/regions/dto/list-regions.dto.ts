import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class ListRegionsDto {
  @ApiPropertyOptional({ type: Number })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  first?: number;

  @ApiPropertyOptional({ type: String, description: 'Cursor from a previous page' })
  @IsOptional()
  @IsString()
  after?: string;
}
