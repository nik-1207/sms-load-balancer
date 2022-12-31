import { IsArray, IsEmail, IsPhoneNumber, IsString } from 'class-validator';

export class SmsDto {
  @IsArray()
  @IsPhoneNumber(undefined, { each: true })
  public phoneNumbers: Array<string>;

  @IsArray()
  @IsString({ each: true })
  public texts: Array<string>;
}
