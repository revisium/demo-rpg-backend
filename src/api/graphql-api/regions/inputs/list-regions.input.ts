import { InputType, Field, Int } from '@nestjs/graphql';

@InputType()
export class ListRegionsInput {
  @Field(() => Int, { nullable: true })
  first?: number;

  @Field(() => Int, { nullable: true })
  skip?: number;
}
