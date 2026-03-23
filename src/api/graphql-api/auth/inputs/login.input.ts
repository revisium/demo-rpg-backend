import { InputType, Field } from '@nestjs/graphql';
import { IsEmail, IsString, MinLength } from 'class-validator';

const MIN_PASSWORD_LENGTH = 6;

@InputType()
export class LoginInput {
  @Field()
  @IsEmail()
  email!: string;

  @Field()
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password!: string;
}
