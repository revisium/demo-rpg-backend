import { ObjectType, Field } from '@nestjs/graphql';
import { RegionClimate } from 'src/features/regions/queries/impl/list-regions.query';

@ObjectType()
export class LocalizedStringModel {
  @Field()
  en!: string;

  @Field()
  ru!: string;

  @Field()
  zh!: string;
}

@ObjectType()
export class RegionModel {
  @Field()
  id!: string;

  @Field(() => LocalizedStringModel)
  name!: LocalizedStringModel;

  @Field(() => LocalizedStringModel)
  description!: LocalizedStringModel;

  @Field()
  climate!: RegionClimate;
}
