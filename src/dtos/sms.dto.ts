import { IsArray, IsEmail, IsString } from 'class-validator';

export class CreateUserDto {
  @IsArray({ each: true })
  public phoneNumbers: string;

  @IsString()
  public password: string;
}
