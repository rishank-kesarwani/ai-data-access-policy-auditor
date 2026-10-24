import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsObject,
  IsOptional,
  IsString,
} from 'class-validator';
import { ActionType, PurposeType } from '../../../common/types';

export class PrincipalDto {
  @ApiPropertyOptional({ example: 'usr-agent-worker-01' })
  @IsString()
  @IsOptional()
  userId?: string;

  @ApiPropertyOptional({ example: 'AI_AGENT_WORKER' })
  @IsString()
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ example: 'tenant-enterprise-prod' })
  @IsString()
  @IsOptional()
  tenantId?: string;

  @ApiPropertyOptional({ example: '10.0.14.22' })
  @IsString()
  @IsOptional()
  clientIp?: string;

  @ApiPropertyOptional({ example: true })
  @IsBoolean()
  @IsOptional()
  mfaVerified?: boolean;
}

export class EvaluateAccessRequestDto {
  @ApiPropertyOptional({ example: 'req-sim-001' })
  @IsString()
  @IsOptional()
  requestId?: string;

  @ApiProperty({ example: 'support-chat-assistant' })
  @IsString()
  @IsNotEmpty()
  workflowId: string;

  @ApiProperty({ example: 'customer-support-transcripts' })
  @IsString()
  @IsNotEmpty()
  dataSourceId: string;

  @ApiProperty({
    enum: ['READ', 'TRAIN', 'EMBED', 'FINE_TUNE', 'INFER', 'EXPORT', 'CACHE'],
    example: 'READ',
  })
  @IsEnum(['READ', 'TRAIN', 'EMBED', 'FINE_TUNE', 'INFER', 'EXPORT', 'CACHE'])
  action: ActionType;

  @ApiProperty({
    enum: [
      'CUSTOMER_SUPPORT',
      'ANALYTICS',
      'MODEL_TRAINING',
      'RAG_RETRIEVAL',
      'FRAUD_DETECTION',
      'OPERATIONAL_DEBUGGING',
    ],
    example: 'CUSTOMER_SUPPORT',
  })
  @IsEnum([
    'CUSTOMER_SUPPORT',
    'ANALYTICS',
    'MODEL_TRAINING',
    'RAG_RETRIEVAL',
    'FRAUD_DETECTION',
    'OPERATIONAL_DEBUGGING',
  ])
  purpose: PurposeType;

  @ApiPropertyOptional({ type: PrincipalDto })
  @IsObject()
  @IsOptional()
  principal?: PrincipalDto;

  @ApiPropertyOptional({
    example: {
      pii_tokenized: true,
      user_consent_verified: true,
      retention_days: 30,
      tenant_boundary_enforced: true,
    },
  })
  @IsObject()
  @IsOptional()
  context?: Record<string, any>;

  @ApiPropertyOptional({ default: false })
  @IsBoolean()
  @IsOptional()
  isSimulation?: boolean;

  @ApiPropertyOptional({ example: 'Synthetic test scenario for compliance check' })
  @IsString()
  @IsOptional()
  notes?: string;
}
