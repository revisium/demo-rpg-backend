import { InputType, Field } from '@nestjs/graphql';
import { IsString, MaxLength, IsOptional } from 'class-validator';

const MAX_TITLE_LENGTH = 255;

@InputType()
export class CreateTaskInput {
  @Field()
  @IsString()
  @MaxLength(MAX_TITLE_LENGTH)
  title!: string;

  @Field(() => String, { nullable: true })
  @IsString()
  @IsOptional()
  description?: string;
}
