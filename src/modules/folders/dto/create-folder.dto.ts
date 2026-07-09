import { IsNotEmpty, IsString, IsNumber, IsBoolean, IsOptional } from 'class-validator';

export class CreateFolderDto {
  @IsNotEmpty({ message: 'Folder name is required' })
  @IsString()
  folderName: string;

  @IsNotEmpty({ message: 'Module is required' })
  @IsString()
  module: string;

  @IsOptional()
  @IsString()
  permission?: string;

  @IsOptional()
  @IsNumber()
  orderNumber?: number;

  @IsOptional()
  @IsString()
  configurationType?: string;

  @IsOptional()
  @IsBoolean()
  onlyAssigned?: boolean;

  @IsOptional()
  @IsBoolean()
  smartFolder?: boolean;

  @IsOptional()
  @IsString()
  categoryProperty?: string;
}
