import { IsNotEmpty, IsString, IsArray, IsOptional } from 'class-validator';

export class CreateBranchDto {
  @IsNotEmpty({ message: 'Branch name is required' })
  @IsString()
  name: string;

  @IsNotEmpty({ message: 'Assignee To (Owner) is required' })
  @IsString()
  assigneeTo: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  assignees?: string[];

  @IsOptional()
  @IsString()
  untouchDuration?: string;

  @IsOptional()
  @IsString()
  routing?: string;
}
