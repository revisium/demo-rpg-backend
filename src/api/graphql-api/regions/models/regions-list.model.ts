import { ObjectType, Field, Int } from '@nestjs/graphql';
import { RegionModel } from './region.model';

@ObjectType()
export class RegionsListModel {
  @Field(() => [RegionModel])
  edges!: RegionModel[];

  @Field(() => Int)
  totalCount!: number;
}
