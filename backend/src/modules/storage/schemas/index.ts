import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document } from 'mongoose';
import {
  ActionType,
  DecisionOutcome,
  PolicyCondition,
  PolicyRule,
  PolicyRuleType,
  PolicyStatus,
  PurposeType,
  SensitivityLevel,
  WorkflowRiskTier,
} from '../../../common/types';

// Workflow Schema
@Schema({ collection: 'workflows', timestamps: true })
export class WorkflowDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true })
  businessUnit: string;

  @Prop({ required: true })
  riskTier: WorkflowRiskTier;

  @Prop({ required: true })
  modelFamily: string;

  @Prop({ default: true })
  active: boolean;
}
export const WorkflowSchema = SchemaFactory.createForClass(WorkflowDocument);

// DataSource Schema
@Schema({ collection: 'data_sources', timestamps: true })
export class DataSourceDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  owner: string;

  @Prop({ required: true })
  sensitivity: SensitivityLevel;

  @Prop({ required: true })
  residencyRegion: string;

  @Prop({ required: true })
  retentionDaysLimit: number;

  @Prop({ required: true, default: false })
  containsPii: boolean;

  @Prop({ type: [String], default: [] })
  tags: string[];
}
export const DataSourceSchema = SchemaFactory.createForClass(DataSourceDocument);

// Policy Schema
@Schema({ collection: 'policies', timestamps: true })
export class PolicyDocument extends Document {
  @Prop({ required: true })
  declare id: string;

  @Prop({ required: true })
  name: string;

  @Prop({ required: true })
  description: string;

  @Prop({ required: true })
  version: number;

  @Prop({ required: true, default: 'DRAFT' })
  status: PolicyStatus;

  @Prop({ type: Array, default: [] })
  rules: PolicyRule[];

  @Prop({ required: true })
  createdBy: string;

  @Prop()
  approvedBy?: string;

  @Prop()
  approvalNotes?: string;
}
export const PolicySchema = SchemaFactory.createForClass(PolicyDocument);

// Approval Schema
@Schema({ collection: 'approvals', timestamps: true })
export class ApprovalDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true })
  policyId: string;

  @Prop({ required: true })
  policyName: string;

  @Prop({ required: true })
  policyVersion: number;

  @Prop({ required: true })
  submittedBy: string;

  @Prop({ required: true })
  submittedAt: string;

  @Prop({ required: true, default: 'PENDING' })
  status: 'PENDING' | 'APPROVED' | 'REJECTED';

  @Prop()
  reviewedBy?: string;

  @Prop()
  reviewedAt?: string;

  @Prop()
  reviewNotes?: string;

  @Prop({ required: true })
  changesSummary: string;
}
export const ApprovalSchema = SchemaFactory.createForClass(ApprovalDocument);

// Audit Record Schema
@Schema({ collection: 'audit_records', timestamps: true })
export class AuditRecordDocument extends Document {
  @Prop({ required: true, unique: true })
  declare id: string;

  @Prop({ required: true, unique: true })
  sequenceNumber: number;

  @Prop({ required: true })
  timestamp: string;

  @Prop({ required: true })
  requestId: string;

  @Prop({ required: true })
  workflowId: string;

  @Prop({ required: true })
  dataSourceId: string;

  @Prop({ required: true })
  action: ActionType;

  @Prop({ required: true })
  purpose: PurposeType;

  @Prop({ required: true })
  decision: DecisionOutcome;

  @Prop()
  matchedPolicyId: string | null;

  @Prop()
  matchedPolicyVersion: number | null;

  @Prop()
  matchedRuleId: string | null;

  @Prop({ required: true })
  rationale: string;

  @Prop({ required: true, default: false })
  isSimulation: boolean;

  @Prop({ required: true })
  actor: string;

  @Prop({ type: Object, default: {} })
  principal: Record<string, any>;

  @Prop({ type: Object, default: {} })
  contextRedacted: Record<string, any>;

  @Prop({ type: Array, default: [] })
  conditionsEvaluated: any[];

  @Prop({ type: [String], default: [] })
  missingRequirements: string[];

  @Prop({ required: true })
  requestHash: string;

  @Prop({ required: true })
  previousRecordHash: string;

  @Prop({ required: true })
  recordHash: string;
}
export const AuditRecordSchema = SchemaFactory.createForClass(AuditRecordDocument);
