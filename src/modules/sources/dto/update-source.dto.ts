import { ApiPropertyOptional, PartialType } from '@nestjs/swagger';
import { CreateSourceDto } from './create-source.dto';
import { IsBoolean, IsOptional, IsString } from 'class-validator';

export class UpdateSourceDto extends PartialType(CreateSourceDto) {
  @ApiPropertyOptional({
    description: 'Updated name of the source',
    example: 'Instagram Ads',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({
    description: 'Updated source name alias',
    example: 'Instagram Ads',
  })
  @IsOptional()
  @IsString()
  sourceName?: string;

  @ApiPropertyOptional({
    description: 'Updated source alias',
    example: 'Instagram Ads',
  })
  @IsOptional()
  @IsString()
  source?: string;

  @ApiPropertyOptional({
    description: 'Active status',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}


