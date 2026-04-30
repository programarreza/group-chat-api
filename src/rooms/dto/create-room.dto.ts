import { IsString, Matches, Length } from 'class-validator';

export class CreateRoomDto {
  @IsString()
  @Length(3, 32, { message: 'name must be between 3 and 32 characters' })
  @Matches(/^[a-zA-Z0-9-]+$/, { message: 'name must be alphanumeric and hyphens only' })
  name: string;
}
