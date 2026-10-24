import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class LoginDto {
  @ApiPropertyOptional({ example: 'admin@secops.internal' })
  @IsString()
  @IsOptional()
  email?: string;

  @ApiProperty({ example: 'admin123!' })
  @IsString()
  @IsNotEmpty()
  password: string;
}
