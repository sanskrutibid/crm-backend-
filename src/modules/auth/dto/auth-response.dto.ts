import { ApiProperty } from '@nestjs/swagger';

export class AuthUserDto {
  @ApiProperty({
    example: '60d5ecb8b394142e88a38c21',
    description: 'Database primary key ID',
  })
  id!: string;

  @ApiProperty({ example: 'agent@crmapp.com', description: 'User email' })
  email!: string;

  @ApiProperty({ example: 'John', description: 'First name' })
  firstName: string;

  @ApiProperty({ example: 'Doe', description: 'Last name' })
  lastName: string;

  @ApiProperty({
    example: 'AGENT',
    description: 'Role assignment (ADMIN | AGENT)',
  })
  role: string;
}

export class AuthResponseDataDto {
  @ApiProperty({ description: 'Profile details of authenticated user' })
  user: AuthUserDto;

  @ApiProperty({
    example:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MGQ1ZWNiOGIzOTQxNDJlODhhMzhjMjEiLCJlbWFpbCI6ImFnZW50QGNybWFwcC5jb20iLCJyb2xlIjoiQUdFTlQiLCJpYXQiOjE3NzA3MjAwMDAsImV4cCI6MTc3MDgwNjQwMH0.signature',
    description: 'Signed JSON Web Token for authorizing HTTP requests',
  })
  accessToken: string;
}
