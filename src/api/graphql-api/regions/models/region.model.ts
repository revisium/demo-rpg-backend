import { ObjectType, Field } from '@nestjs/graphql';

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
  climate!: string;
}
