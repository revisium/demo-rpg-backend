import { ObjectType, Field, Int } from '@nestjs/graphql';

@ObjectType()
export class LoginResponseModel {
  @Field(() => Int)
  expiresIn!: number;

  @Field()
  tokenType!: string;
}
