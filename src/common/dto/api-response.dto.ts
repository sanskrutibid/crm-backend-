import { ApiProperty } from '@nestjs/swagger';

export class ApiResponseDto<T> {
  @ApiProperty({ example: true, description: 'Indicates if the API request succeeded' })
  success: boolean;

  @ApiProperty({ example: 200, description: 'HTTP Status Code' })
  statusCode: number;

  @ApiProperty({ example: 'Operation completed successfully', description: 'Descriptive message' })
  message: string;

  data: T;
}

export class ApiErrorResponseDto {
  @ApiProperty({ example: false, description: 'Indicates request success status' })
  success: boolean;

  @ApiProperty({ example: 400, description: 'HTTP Error Status Code' })
  statusCode: number;

  @ApiProperty({
    example: ['Email must be a valid email address'],
    description: 'Error messages or validation errors list',
  })
  message: string[];

  @ApiProperty({ example: 'Bad Request', description: 'HTTP Error category name' })
  error: string;

  @ApiProperty({ example: '2026-05-26T14:04:03.000Z', description: 'ISO date timestamp of error occurrence' })
  timestamp: string;

  @ApiProperty({ example: '/api/v1/leads', description: 'Request path that raised the exception' })
  path: string;
}
