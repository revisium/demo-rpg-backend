import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

const MIN_USERNAME_LENGTH = 3;
const MAX_USERNAME_LENGTH = 50;
const MIN_PASSWORD_LENGTH = 6;

export class SignUpDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'Username' })
  @IsString()
  @MinLength(MIN_USERNAME_LENGTH)
  @MaxLength(MAX_USERNAME_LENGTH)
  username!: string;

  @ApiProperty({ description: 'User password', minLength: MIN_PASSWORD_LENGTH })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password!: string;
}
