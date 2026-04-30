import { IsString, Length, IsNotEmpty } from 'class-validator';
import { Transform } from 'class-transformer';

export class SendMessageDto {
  @IsString()
  @IsNotEmpty()
  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @Length(1, 1000, { message: 'Message content must not exceed 1000 characters' })
  content: string;
}
