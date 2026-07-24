import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';

export class SaveSmtpConfigDto {
  @ApiProperty({ example: 'smtp.gmail.com', description: 'SMTP server host' })
  @IsString()
  @IsNotEmpty()
  host: string;

  @ApiProperty({ example: 587, description: 'SMTP server port (e.g. 587, 465, 25)' })
  @IsNumber()
  @IsNotEmpty()
  port: number;

  @ApiProperty({ example: false, description: 'Use secure connection (SSL/TLS)' })
  @IsBoolean()
  @IsOptional()
  secure?: boolean = false;

  @ApiProperty({ example: 'user@gmail.com', description: 'SMTP auth user email' })
  @IsString()
  @IsNotEmpty()
  user: string;

  @ApiPropertyOptional({ example: 'abcde12345', description: 'SMTP auth user app password' })
  @IsString()
  @IsOptional()
  pass?: string;

  @ApiPropertyOptional({ example: 'Rahul Sharma', description: 'Display name for sent emails' })
  @IsString()
  @IsOptional()
  fromName?: string;
}
