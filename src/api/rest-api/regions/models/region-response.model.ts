import { ApiProperty } from '@nestjs/swagger';
import {
  REGION_CLIMATES,
  RegionClimate,
} from 'src/features/regions/queries/impl/list-regions.query';

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

  @ApiProperty({ enum: REGION_CLIMATES })
  climate!: RegionClimate;
}

export class RegionsListResponseModel {
  @ApiProperty({ type: [RegionResponseModel] })
  edges!: RegionResponseModel[];

  @ApiProperty()
  totalCount!: number;
}
