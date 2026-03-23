import { ApiProperty } from '@nestjs/swagger';

export class PaginatedMeta {
  @ApiProperty()
  totalCount!: number;

  @ApiProperty()
  first!: number;

  @ApiProperty()
  skip!: number;
}
