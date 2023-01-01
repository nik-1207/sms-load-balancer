import { Transform } from 'class-transformer';
import { IsPhoneNumber, IsString } from 'class-validator';

export default class Message {
  @Transform(value => value.toString(), { toPlainOnly: true })
  @IsPhoneNumber()
  phoneNumber: string;

  @IsString()
  text: string;
}
