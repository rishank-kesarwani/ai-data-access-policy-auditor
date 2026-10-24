import { PolicyEvaluatorService } from './policy-evaluator.service';
import {
  AccessRequest,
  DataSource,
  Policy,
  Workflow,
} from '../../common/types';

describe('PolicyEvaluatorService', () => {
  let evaluator: PolicyEvaluatorService;

  const mockWorkflow: Workflow = {
    id: 'support-chat-assistant',
    name: 'Customer Support LLM Copilot',
    description: 'Support bot',
    owner: 'cx@company.internal',
    businessUnit: 'Support',
    riskTier: 'MEDIUM',
    modelFamily: 'GPT-4o',
    active: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockDataSource: DataSource = {
    id: 'customer-support-transcripts',
    name: 'Customer Support Transcripts',
    description: 'Transcripts',
    owner: 'cx@company.internal',
    sensitivity: 'CONFIDENTIAL',
    residencyRegion: 'us-east-1',
    retentionDaysLimit: 90,
    containsPii: true,
    tags: ['pii'],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const mockPolicy: Policy = {
    id: 'pol-test-baseline',
    name: 'Test Baseline Policy',
    description: 'Testing',
    version: 1,
    status: 'ACTIVE',
    createdBy: 'secops@company.internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules: [
      {
        id: 'RULE-ALLOW-SUPPORT-READ',
        description: 'Allow Support Bot to read transcripts with consent & tokenized PII',
        effect: 'ALLOW',
        actions: ['READ'],
        purposes: ['CUSTOMER_SUPPORT'],
        workflowScope: ['support-chat-assistant'],
        dataSourceScope: ['customer-support-transcripts'],
        conditions: [
          {
            name: 'pii_tokenized',
            operator: 'BOOLEAN_TRUE',
            expectedValue: true,
            description: 'PII must be tokenized',
          },
          {
            name: 'user_consent_verified',
            operator: 'BOOLEAN_TRUE',
            expectedValue: true,
            description: 'Consent verified',
          },
        ],
      },
      {
        id: 'RULE-DENY-TRAINING',
        description: 'Explicit DENY for training on transcripts',
        effect: 'DENY',
        actions: ['TRAIN', 'FINE_TUNE', 'EXPORT'],
        purposes: ['*'],
        workflowScope: ['*'],
        dataSourceScope: ['customer-support-transcripts'],
        conditions: [],
      },
      {
        id: 'RULE-ESCALATE-EXPORT',
        description: 'Escalate export requests',
        effect: 'ESCALATE',
        actions: ['EXPORT'],
        purposes: ['ANALYTICS'],
        workflowScope: ['support-chat-assistant'],
        dataSourceScope: ['*'],
        conditions: [],
        escalationReason: 'Data export requires SecOps signoff',
      },
    ],
  };

  beforeEach(() => {
    evaluator = new PolicyEvaluatorService();
  });

  it('should ALLOW access when matching rule and all mandatory conditions are fulfilled', () => {
    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'customer-support-transcripts',
      action: 'READ',
      purpose: 'CUSTOMER_SUPPORT',
      context: {
        pii_tokenized: true,
        user_consent_verified: true,
      },
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy],
      workflow: mockWorkflow,
      dataSource: mockDataSource,
    });

    expect(result.decision).toBe('ALLOW');
    expect(result.matchedPolicyId).toBe('pol-test-baseline');
    expect(result.matchedRuleId).toBe('RULE-ALLOW-SUPPORT-READ');
    expect(result.missingRequirements).toHaveLength(0);
    expect(result.evaluatedConditions.every((c) => c.satisfied)).toBe(true);
  });

  it('should DENY access when mandatory conditions fail even if scope matches', () => {
    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'customer-support-transcripts',
      action: 'READ',
      purpose: 'CUSTOMER_SUPPORT',
      context: {
        pii_tokenized: false, // Fails condition!
        user_consent_verified: true,
      },
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy],
      workflow: mockWorkflow,
      dataSource: mockDataSource,
    });

    expect(result.decision).toBe('DENY');
    expect(result.matchedPolicyId).toBe('pol-test-baseline');
    expect(result.missingRequirements).toContain('PII must be tokenized');
  });

  it('should enforce DENY overrides ALLOW when explicit DENY rule matches (Precedence rule)', () => {
    // If a policy allows all actions on customer-transcripts, the explicit DENY rule for TRAIN must still win
    const permissivePolicy: Policy = {
      id: 'pol-permissive',
      name: 'Permissive Policy',
      description: 'Overly permissive rule',
      version: 1,
      status: 'ACTIVE',
      createdBy: 'dev@company.internal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [
        {
          id: 'RULE-PERMISSIVE-ALLOW',
          description: 'Allows everything',
          effect: 'ALLOW',
          actions: ['*'],
          purposes: ['*'],
          workflowScope: ['*'],
          dataSourceScope: ['*'],
          conditions: [],
        },
      ],
    };

    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'customer-support-transcripts',
      action: 'TRAIN', // Matched by RULE-DENY-TRAINING in mockPolicy
      purpose: 'MODEL_TRAINING',
      context: {},
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy, permissivePolicy],
      workflow: mockWorkflow,
      dataSource: mockDataSource,
    });

    expect(result.decision).toBe('DENY');
    expect(result.matchedRuleId).toBe('RULE-DENY-TRAINING');
  });

  it('should trigger ESCALATE for high-risk operations on sensitive data', () => {
    const sensitiveDataSource: DataSource = {
      ...mockDataSource,
      id: 'financial-ledger',
      sensitivity: 'RESTRICTED_FINANCIAL',
    };

    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'financial-ledger',
      action: 'FINE_TUNE',
      purpose: 'MODEL_TRAINING',
      context: {},
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy],
      workflow: mockWorkflow,
      dataSource: sensitiveDataSource,
    });

    expect(result.decision).toBe('ESCALATE');
    expect(result.rationale).toContain('High-risk model training or export on restricted assets strictly requires manual SecOps authorization');
  });

  it('should safely default-deny when no policies match request', () => {
    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'customer-support-transcripts',
      action: 'CACHE',
      purpose: 'OPERATIONAL_DEBUGGING',
      context: {},
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy],
      workflow: mockWorkflow,
      dataSource: mockDataSource,
    });

    expect(result.decision).toBe('DENY');
    expect(result.matchedPolicyId).toBeNull();
    expect(result.rationale).toContain('Safe Default-Deny');
  });

  it('should DENY when workflow is unknown or inactive', () => {
    const inactiveWorkflow: Workflow = {
      ...mockWorkflow,
      active: false,
    };

    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'customer-support-transcripts',
      action: 'READ',
      purpose: 'CUSTOMER_SUPPORT',
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy],
      workflow: inactiveWorkflow,
      dataSource: mockDataSource,
    });

    expect(result.decision).toBe('DENY');
    expect(result.rationale).toContain('INACTIVE');
  });

  it('should DENY when data source is uncataloged', () => {
    const request: AccessRequest = {
      workflowId: 'support-chat-assistant',
      dataSourceId: 'unknown-shadow-db',
      action: 'READ',
      purpose: 'CUSTOMER_SUPPORT',
      isSimulation: true,
    };

    const result = evaluator.evaluate({
      request,
      activePolicies: [mockPolicy],
      workflow: mockWorkflow,
      dataSource: null,
    });

    expect(result.decision).toBe('DENY');
    expect(result.rationale).toContain('Safe default-deny prevents access to uncataloged assets');
  });
});
