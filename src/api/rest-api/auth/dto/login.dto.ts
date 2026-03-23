import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength } from 'class-validator';

const MIN_PASSWORD_LENGTH = 6;

export class LoginDto {
  @ApiProperty({ description: 'User email' })
  @IsEmail()
  email!: string;

  @ApiProperty({ description: 'User password' })
  @IsString()
  @MinLength(MIN_PASSWORD_LENGTH)
  password!: string;
}
