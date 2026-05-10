import { InputType, Field, Int } from '@nestjs/graphql';
import { IsInt, IsOptional, IsString, Min } from 'class-validator';

@InputType()
export class ListRegionsInput {
  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  first?: number;

  @Field({ nullable: true })
  @IsOptional()
  @IsString()
  after?: string;
}
