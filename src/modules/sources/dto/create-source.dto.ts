import { IsNotEmpty, IsString } from 'class-validator';

export class CreateSourceDto {
  @IsNotEmpty({ message: 'Source name is required' })
  @IsString()
  name: string;
}
