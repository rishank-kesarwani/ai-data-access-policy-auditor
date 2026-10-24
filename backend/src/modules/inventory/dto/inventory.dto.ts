import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { SensitivityLevel, WorkflowRiskTier } from '../../../common/types';

export class CreateWorkflowDto {
  @ApiProperty({ example: 'customer-rag-copilot' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Customer Support RAG Copilot' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Answers customer inquiries using knowledge base retrieval' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'cx-team@company.internal' })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiProperty({ example: 'Customer Support' })
  @IsString()
  @IsNotEmpty()
  businessUnit: string;

  @ApiProperty({ enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'], example: 'MEDIUM' })
  @IsEnum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'])
  riskTier: WorkflowRiskTier;

  @ApiProperty({ example: 'GPT-4o' })
  @IsString()
  @IsNotEmpty()
  modelFamily: string;

  @ApiPropertyOptional({ default: true })
  @IsBoolean()
  @IsOptional()
  active?: boolean;
}

export class CreateDataSourceDto {
  @ApiProperty({ example: 'customer-db-replica' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Customer Profiles & Orders Database' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Read replica of customer identity and purchasing history' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ example: 'data-platform@company.internal' })
  @IsString()
  @IsNotEmpty()
  owner: string;

  @ApiProperty({
    enum: [
      'PUBLIC',
      'INTERNAL',
      'CONFIDENTIAL',
      'RESTRICTED_PII',
      'RESTRICTED_FINANCIAL',
      'RESTRICTED_HEALTH',
    ],
    example: 'RESTRICTED_PII',
  })
  @IsEnum([
    'PUBLIC',
    'INTERNAL',
    'CONFIDENTIAL',
    'RESTRICTED_PII',
    'RESTRICTED_FINANCIAL',
    'RESTRICTED_HEALTH',
  ])
  sensitivity: SensitivityLevel;

  @ApiProperty({ example: 'us-east-1' })
  @IsString()
  @IsNotEmpty()
  residencyRegion: string;

  @ApiProperty({ example: 90 })
  @IsNumber()
  @Min(1)
  retentionDaysLimit: number;

  @ApiProperty({ default: true })
  @IsBoolean()
  containsPii: boolean;

  @ApiPropertyOptional({ type: [String] })
  @IsArray()
  @IsOptional()
  tags?: string[];
}
