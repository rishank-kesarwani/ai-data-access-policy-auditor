import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import {
  ActionType,
  ConditionOperator,
  PolicyRuleType,
  PolicyStatus,
  PurposeType,
  SensitivityLevel,
} from '../../../common/types';

export class PolicyConditionDto {
  @ApiProperty({ example: 'pii_tokenized' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    enum: [
      'EQUALS',
      'NOT_EQUALS',
      'IN',
      'LESS_THAN_OR_EQUAL',
      'GREATER_THAN_OR_EQUAL',
      'BOOLEAN_TRUE',
    ],
    example: 'BOOLEAN_TRUE',
  })
  @IsEnum([
    'EQUALS',
    'NOT_EQUALS',
    'IN',
    'LESS_THAN_OR_EQUAL',
    'GREATER_THAN_OR_EQUAL',
    'BOOLEAN_TRUE',
  ])
  operator: ConditionOperator;

  @ApiProperty({ example: true })
  expectedValue: any;

  @ApiPropertyOptional({ example: 'PII masking must be active on this data pipe' })
  @IsString()
  @IsOptional()
  description?: string;
}

export class PolicyRuleDto {
  @ApiProperty({ example: 'RULE-101' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Allow Customer Support Bot to Read Knowledge Lake' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiProperty({ enum: ['ALLOW', 'DENY', 'ESCALATE'], example: 'ALLOW' })
  @IsEnum(['ALLOW', 'DENY', 'ESCALATE'])
  effect: PolicyRuleType;

  @ApiProperty({ type: [String], example: ['READ', 'INFER'] })
  @IsArray()
  actions: ActionType[];

  @ApiProperty({ type: [String], example: ['CUSTOMER_SUPPORT', 'RAG_RETRIEVAL'] })
  @IsArray()
  purposes: PurposeType[];

  @ApiProperty({ type: [String], example: ['support-chat-assistant'] })
  @IsArray()
  workflowScope: string[];

  @ApiProperty({ type: [String], example: ['product-documentation-lake'] })
  @IsArray()
  dataSourceScope: string[];

  @ApiPropertyOptional({
    type: [String],
    example: ['INTERNAL', 'CONFIDENTIAL'],
  })
  @IsArray()
  @IsOptional()
  sensitivityScope?: SensitivityLevel[];

  @ApiPropertyOptional({ type: [PolicyConditionDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyConditionDto)
  @IsOptional()
  conditions?: PolicyConditionDto[];

  @ApiPropertyOptional({ example: 'Requires dual authorization for export' })
  @IsString()
  @IsOptional()
  escalationReason?: string;
}

export class CreatePolicyDto {
  @ApiProperty({ example: 'pol-customer-data-v1' })
  @IsString()
  @IsNotEmpty()
  id: string;

  @ApiProperty({ example: 'Customer Transcripts AI Access Policy' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({ example: 'Explicit rules governing LLM access to transcripts' })
  @IsString()
  @IsNotEmpty()
  description: string;

  @ApiPropertyOptional({ default: 1 })
  @IsNumber()
  @IsOptional()
  version?: number;

  @ApiPropertyOptional({ enum: ['DRAFT', 'ACTIVE'], default: 'DRAFT' })
  @IsEnum(['DRAFT', 'ACTIVE'])
  @IsOptional()
  status?: PolicyStatus;

  @ApiProperty({ type: [PolicyRuleDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PolicyRuleDto)
  rules: PolicyRuleDto[];
}

export class SubmitApprovalDto {
  @ApiProperty({ example: 'Added new rule for sentiment analysis evaluation' })
  @IsString()
  @IsNotEmpty()
  changesSummary: string;
}
