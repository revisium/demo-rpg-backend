import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
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

export class RegionEdgeResponseModel {
  @ApiProperty()
  cursor!: string;

  @ApiProperty({ type: RegionResponseModel })
  node!: RegionResponseModel;
}

export class RegionPageInfoResponseModel {
  @ApiPropertyOptional()
  endCursor?: string;

  @ApiProperty()
  hasNextPage!: boolean;
}

export class RegionsListResponseModel {
  @ApiProperty({ type: [RegionEdgeResponseModel] })
  edges!: RegionEdgeResponseModel[];

  @ApiProperty()
  totalCount!: number;

  @ApiProperty({ type: RegionPageInfoResponseModel })
  pageInfo!: RegionPageInfoResponseModel;
}
