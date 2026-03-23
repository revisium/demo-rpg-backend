import { ObjectType, Field } from '@nestjs/graphql';

@ObjectType()
export class SuccessModel {
  @Field()
  success!: boolean;
}
