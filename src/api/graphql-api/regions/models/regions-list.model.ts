import { ObjectType, Field, Int } from '@nestjs/graphql';
import { RegionModel } from './region.model';

@ObjectType()
export class RegionEdgeModel {
  @Field()
  cursor!: string;

  @Field(() => RegionModel)
  node!: RegionModel;
}

@ObjectType()
export class RegionPageInfoModel {
  @Field({ nullable: true })
  endCursor?: string;

  @Field()
  hasNextPage!: boolean;
}

@ObjectType()
export class RegionsListModel {
  @Field(() => [RegionEdgeModel])
  edges!: RegionEdgeModel[];

  @Field(() => Int)
  totalCount!: number;

  @Field(() => RegionPageInfoModel)
  pageInfo!: RegionPageInfoModel;
}
