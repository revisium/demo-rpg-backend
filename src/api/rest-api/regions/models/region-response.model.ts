import { ApiProperty } from '@nestjs/swagger';

export class LocalizedStringResponseModel {
  @ApiProperty()
  en!: string;

  @ApiProperty()
  ru!: string;

  @ApiProperty()
  zh!: string;
}

export class RegionResponseModel {
  @ApiProperty()
  id!: string;

  @ApiProperty({ type: LocalizedStringResponseModel })
  name!: LocalizedStringResponseModel;

  @ApiProperty({ type: LocalizedStringResponseModel })
  description!: LocalizedStringResponseModel;

  @ApiProperty({ enum: ['temperate', 'alpine', 'coastal', 'desert', 'forest'] })
  climate!: string;
}

export class RegionsListResponseModel {
  @ApiProperty({ type: [RegionResponseModel] })
  edges!: RegionResponseModel[];

  @ApiProperty()
  totalCount!: number;
}
