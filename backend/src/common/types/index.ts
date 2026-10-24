export type SensitivityLevel =
  | 'PUBLIC'
  | 'INTERNAL'
  | 'CONFIDENTIAL'
  | 'RESTRICTED_PII'
  | 'RESTRICTED_FINANCIAL'
  | 'RESTRICTED_HEALTH';

export type ActionType =
  | 'READ'
  | 'TRAIN'
  | 'EMBED'
  | 'FINE_TUNE'
  | 'INFER'
  | 'EXPORT'
  | 'CACHE'
  | '*';

export type PurposeType =
  | 'CUSTOMER_SUPPORT'
  | 'ANALYTICS'
  | 'MODEL_TRAINING'
  | 'RAG_RETRIEVAL'
  | 'FRAUD_DETECTION'
  | 'OPERATIONAL_DEBUGGING'
  | '*';

export type DecisionOutcome = 'ALLOW' | 'DENY' | 'ESCALATE';

export type PolicyRuleType = 'ALLOW' | 'DENY' | 'ESCALATE';

export type PolicyStatus =
  | 'DRAFT'
  | 'PENDING_APPROVAL'
  | 'ACTIVE'
  | 'REJECTED'
  | 'ARCHIVED';

export type WorkflowRiskTier = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface Workflow {
  id: string;
  name: string;
  description: string;
  owner: string;
  businessUnit: string;
  riskTier: WorkflowRiskTier;
  modelFamily: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DataSource {
  id: string;
  name: string;
  description: string;
  owner: string;
  sensitivity: SensitivityLevel;
  residencyRegion: string;
  retentionDaysLimit: number;
  containsPii: boolean;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export type ConditionOperator =
  | 'EQUALS'
  | 'NOT_EQUALS'
  | 'IN'
  | 'LESS_THAN_OR_EQUAL'
  | 'GREATER_THAN_OR_EQUAL'
  | 'BOOLEAN_TRUE';

export interface PolicyCondition {
  name: string;
  operator: ConditionOperator;
  expectedValue: any;
  description?: string;
}

export interface PolicyRule {
  id: string;
  description: string;
  effect: PolicyRuleType;
  actions: ActionType[];
  purposes: PurposeType[];
  workflowScope: string[];
  dataSourceScope: string[];
  sensitivityScope?: SensitivityLevel[];
  conditions: PolicyCondition[];
  escalationReason?: string;
}

export interface Policy {
  id: string;
  name: string;
  description: string;
  version: number;
  status: PolicyStatus;
  rules: PolicyRule[];
  createdBy: string;
  approvedBy?: string;
  approvalNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface AccessRequestPrincipal {
  userId?: string;
  role?: string;
  tenantId?: string;
  clientIp?: string;
  mfaVerified?: boolean;
}

export interface AccessRequest {
  requestId?: string;
  workflowId: string;
  dataSourceId: string;
  action: ActionType;
  purpose: PurposeType;
  principal?: AccessRequestPrincipal;
  context?: Record<string, any>;
  isSimulation?: boolean;
  notes?: string;
}

export interface ConditionEvaluationResult {
  conditionName: string;
  operator: ConditionOperator;
  expected: any;
  actual: any;
  satisfied: boolean;
  description: string;
}

export interface PolicyEvaluationResult {
  decision: DecisionOutcome;
  matchedPolicyId: string | null;
  matchedPolicyName: string | null;
  matchedPolicyVersion: number | null;
  matchedRuleId: string | null;
  matchedRuleEffect: PolicyRuleType | null;
  rationale: string;
  evaluatedConditions: ConditionEvaluationResult[];
  missingRequirements: string[];
  aiExplanation?: string;
  aiPlatformUsed: boolean;
  evaluatedAt: string;
  isSimulation: boolean;
  requestId: string;
  auditRecordId?: string;
}

export interface AuditRecord {
  id: string;
  sequenceNumber: number;
  timestamp: string;
  requestId: string;
  workflowId: string;
  dataSourceId: string;
  action: ActionType;
  purpose: PurposeType;
  decision: DecisionOutcome;
  matchedPolicyId: string | null;
  matchedPolicyVersion: number | null;
  matchedRuleId: string | null;
  rationale: string;
  isSimulation: boolean;
  actor: string;
  principal: Record<string, any>;
  contextRedacted: Record<string, any>;
  conditionsEvaluated: ConditionEvaluationResult[];
  missingRequirements: string[];
  requestHash: string;
  previousRecordHash: string;
  recordHash: string;
}

export interface ApprovalRequest {
  id: string;
  policyId: string;
  policyName: string;
  policyVersion: number;
  submittedBy: string;
  submittedAt: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedBy?: string;
  reviewedAt?: string;
  reviewNotes?: string;
  changesSummary: string;
}

export interface AuditVerificationReport {
  totalRecords: number;
  verifiedValidCount: number;
  tamperedCount: number;
  isChainIntact: boolean;
  invalidRecordIds: string[];
  genesisHash: string;
  latestHash: string;
  verifiedAt: string;
}
