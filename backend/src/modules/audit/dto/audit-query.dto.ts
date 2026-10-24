import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsBoolean, IsNumber, IsOptional, IsString } from 'class-validator';

export class AuditQueryDto {
  @ApiPropertyOptional({ example: 'support-chat-assistant' })
  @IsString()
  @IsOptional()
  workflowId?: string;

  @ApiPropertyOptional({ example: 'customer-support-transcripts' })
  @IsString()
  @IsOptional()
  dataSourceId?: string;

  @ApiPropertyOptional({ enum: ['ALLOW', 'DENY', 'ESCALATE'] })
  @IsString()
  @IsOptional()
  decision?: string;

  @ApiPropertyOptional({ description: 'Filter by simulation vs real authorization' })
  @IsBoolean()
  @IsOptional()
  @Transform(({ value }) => {
    if (value === 'true' || value === true) return true;
    if (value === 'false' || value === false) return false;
    return undefined;
  })
  isSimulation?: boolean;

  @ApiPropertyOptional({ example: 'transcripts' })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({ example: '2026-10-01T00:00:00.000Z' })
  @IsString()
  @IsOptional()
  fromTimestamp?: string;

  @ApiPropertyOptional({ example: '2026-10-31T23:59:59.000Z' })
  @IsString()
  @IsOptional()
  toTimestamp?: string;

  @ApiPropertyOptional({ default: 50 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  limit?: number = 50;

  @ApiPropertyOptional({ default: 0 })
  @IsNumber()
  @IsOptional()
  @Transform(({ value }) => parseInt(value, 10))
  offset?: number = 0;
}
