import { ApiProperty } from '@nestjs/swagger';

export class ErrorModel {
  @ApiProperty()
  statusCode!: number;

  @ApiProperty()
  message!: string;

  @ApiProperty({ required: false })
  error?: string;
}
