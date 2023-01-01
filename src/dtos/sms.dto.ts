import { Type } from 'class-transformer';
import { IsArray, ValidateNested } from 'class-validator';
import Message from './message.dto';

export default class SmsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => Message)
  messages: Message[];
}
