import { ApiProperty } from '@nestjs/swagger';

export class TaskResponseModel {
  @ApiProperty()
  id!: string;

  @ApiProperty()
  title!: string;

  @ApiProperty({ nullable: true })
  description!: string | null;

  @ApiProperty()
  status!: string;

  @ApiProperty()
  userId!: string;

  @ApiProperty()
  createdAt!: Date;

  @ApiProperty()
  updatedAt!: Date;
}

export class TasksListResponseModel {
  @ApiProperty({ type: [TaskResponseModel] })
  items!: TaskResponseModel[];

  @ApiProperty()
  totalCount!: number;
}
