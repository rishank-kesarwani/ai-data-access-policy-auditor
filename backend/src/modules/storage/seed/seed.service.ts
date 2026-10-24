import { Inject, Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import {
  INVENTORY_REPOSITORY,
  POLICY_REPOSITORY,
  APPROVAL_REPOSITORY,
  AUDIT_REPOSITORY,
} from '../storage.module';
import {
  IInventoryRepository,
  IPolicyRepository,
  IApprovalRepository,
  IAuditRepository,
} from '../storage.types';
import {
  DataSource,
  Policy,
  Workflow,
  ApprovalRequest,
} from '../../../common/types';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: IInventoryRepository,
    @Inject(POLICY_REPOSITORY)
    private readonly policyRepo: IPolicyRepository,
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepo: IApprovalRepository,
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepo: IAuditRepository,
  ) {}

  async onApplicationBootstrap() {
    await this.seedInitialData();
  }

  async seedInitialData() {
    const existingWorkflows = await this.inventoryRepo.getWorkflows();
    if (existingWorkflows.length > 0) {
      this.logger.log('Seed data already present. Skipping initialization.');
      return;
    }

    this.logger.log('Seeding enterprise baseline data sources, workflows, and policies...');

    // 1. Data Sources
    const dataSources: DataSource[] = [
      {
        id: 'customer-support-transcripts',
        name: 'Customer Support Transcripts (S3 Bucket)',
        description: 'Historical customer chat, email, and voice call transcripts',
        owner: 'cx-operations@company.internal',
        sensitivity: 'CONFIDENTIAL',
        residencyRegion: 'us-east-1',
        retentionDaysLimit: 90,
        containsPii: true,
        tags: ['customer', 'conversations', 'pii', 's3'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'product-documentation-lake',
        name: 'Enterprise Knowledge & Product Docs',
        description: 'Internal and external knowledge base, API specs, and feature guidelines',
        owner: 'product-enablement@company.internal',
        sensitivity: 'INTERNAL',
        residencyRegion: 'us-east-1',
        retentionDaysLimit: 365,
        containsPii: false,
        tags: ['docs', 'confluence', 'engineering'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'financial-transactions-ledger',
        name: 'Core Ledger & Settlement Records',
        description: 'Payment settlements, bank reconciliations, and transactional metadata',
        owner: 'finsec-platform@company.internal',
        sensitivity: 'RESTRICTED_FINANCIAL',
        residencyRegion: 'us-east-1',
        retentionDaysLimit: 2555,
        containsPii: true,
        tags: ['pci-dss', 'settlement', 'audit-critical'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'clinical-patient-records',
        name: 'Health Records & Medical Imaging Metadata',
        description: 'HIPAA-regulated health data and clinician consultation notes',
        owner: 'clinical-compliance@company.internal',
        sensitivity: 'RESTRICTED_HEALTH',
        residencyRegion: 'eu-west-1',
        retentionDaysLimit: 1825,
        containsPii: true,
        tags: ['hipaa', 'health', 'restricted'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'public-api-knowledge-base',
        name: 'Public Developer Portal Documentation',
        description: 'Public technical documentation, release notes, and SDK references',
        owner: 'devrel@company.internal',
        sensitivity: 'PUBLIC',
        residencyRegion: 'global',
        retentionDaysLimit: 365,
        containsPii: false,
        tags: ['public', 'developer', 'docs'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const ds of dataSources) {
      await this.inventoryRepo.createDataSource(ds);
    }

    // 2. AI Workflows
    const workflows: Workflow[] = [
      {
        id: 'support-chat-assistant',
        name: 'Customer Support LLM Copilot',
        description: 'Real-time retrieval-augmented assistant answering customer inquiries',
        owner: 'cx-engineering@company.internal',
        businessUnit: 'Customer Experience',
        riskTier: 'MEDIUM',
        modelFamily: 'GPT-4o',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'code-generation-copilot',
        name: 'Internal Developer Code Assistant',
        description: 'Assists engineers with code generation, reviews, and test authoring',
        owner: 'developer-productivity@company.internal',
        businessUnit: 'Core Engineering',
        riskTier: 'LOW',
        modelFamily: 'Claude 3.5 Sonnet',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'financial-fraud-detector',
        name: 'Real-time Payment Anomaly Detector',
        description: 'Deep neural model evaluating transaction velocity and fraudulent patterns',
        owner: 'fraud-ops@company.internal',
        businessUnit: 'Risk & Compliance',
        riskTier: 'HIGH',
        modelFamily: 'Custom Llama 3 Fine-Tuned',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'marketing-copy-generator',
        name: 'Marketing Content Synthesis Agent',
        description: 'Automated drafts for promotional blogs, emails, and announcements',
        owner: 'growth-marketing@company.internal',
        businessUnit: 'Marketing',
        riskTier: 'LOW',
        modelFamily: 'GPT-4o-mini',
        active: true,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
      {
        id: 'deprecated-legacy-summarizer',
        name: 'Legacy Batch Transcribe Summarizer (Decommissioned)',
        description: 'Older batch processor retired due to obsolete cryptographic standards',
        owner: 'infra-archived@company.internal',
        businessUnit: 'Infrastructure',
        riskTier: 'CRITICAL',
        modelFamily: 'GPT-3.5-turbo',
        active: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    ];

    for (const wf of workflows) {
      await this.inventoryRepo.createWorkflow(wf);
    }

    // 3. Policies
    const baselinePolicy: Policy = {
      id: 'pol-enterprise-baseline-v1',
      name: 'Enterprise AI Data Protection & Authorization Baseline',
      description:
        'Standard zero-trust authorization governing AI model access to internal documentation, customer transcripts, and financial records.',
      version: 1,
      status: 'ACTIVE',
      createdBy: 'secops-lead@company.internal',
      approvedBy: 'chief-information-security-officer@company.internal',
      approvalNotes: 'Approved after quarterly security review.',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [
        {
          id: 'RULE-001-ALLOW-SUPPORT-READ',
          description:
            'Allow Support Copilot to READ and EMBED customer transcripts only with verified consent and tokenized PII.',
          effect: 'ALLOW',
          actions: ['READ', 'EMBED', 'INFER'],
          purposes: ['CUSTOMER_SUPPORT', 'RAG_RETRIEVAL'],
          workflowScope: ['support-chat-assistant'],
          dataSourceScope: ['customer-support-transcripts', 'product-documentation-lake', 'public-api-knowledge-base'],
          conditions: [
            {
              name: 'pii_tokenized',
              operator: 'BOOLEAN_TRUE',
              expectedValue: true,
              description: 'PII masking/tokenization must be confirmed on data access pipe',
            },
            {
              name: 'user_consent_verified',
              operator: 'BOOLEAN_TRUE',
              expectedValue: true,
              description: 'End-user agreement for AI-assisted customer service must be active',
            },
          ],
        },
        {
          id: 'RULE-002-DENY-TRAINING-ON-PII',
          description:
            'Strictly DENY model training, fine-tuning, or raw export on confidential customer support transcripts.',
          effect: 'DENY',
          actions: ['TRAIN', 'FINE_TUNE', 'EXPORT'],
          purposes: ['*'],
          workflowScope: ['*'],
          dataSourceScope: ['customer-support-transcripts'],
          conditions: [],
        },
        {
          id: 'RULE-003-ALLOW-DEVELOPER-COPILOT',
          description:
            'Permit developer code assistant to inspect product documentation and public developer specs.',
          effect: 'ALLOW',
          actions: ['READ', 'INFER'],
          purposes: ['OPERATIONAL_DEBUGGING', 'ANALYTICS', 'RAG_RETRIEVAL'],
          workflowScope: ['code-generation-copilot'],
          dataSourceScope: ['product-documentation-lake', 'public-api-knowledge-base'],
          conditions: [],
        },
        {
          id: 'RULE-004-ESCALATE-FINANCIAL-ACCESS',
          description:
            'Escalate any AI workflow queries touching restricted financial transactions ledger for SecOps review.',
          effect: 'ESCALATE',
          actions: ['READ', 'INFER'],
          purposes: ['FRAUD_DETECTION', 'ANALYTICS'],
          workflowScope: ['financial-fraud-detector'],
          dataSourceScope: ['financial-transactions-ledger'],
          conditions: [
            {
              name: 'tenant_boundary_enforced',
              operator: 'BOOLEAN_TRUE',
              expectedValue: true,
              description: 'Multi-tenant isolation verified by gateway token',
            },
            {
              name: 'mfa_verified',
              operator: 'BOOLEAN_TRUE',
              expectedValue: true,
              description: 'Operator step-up authentication verified',
            },
          ],
          escalationReason:
            'Access to settlement ledger touches sensitive payment records; requires dual-custody SecOps clearance.',
        },
      ],
    };

    await this.policyRepo.createPolicy(baselinePolicy);

    // Draft Policy in Approval Queue
    const draftPolicy: Policy = {
      id: 'pol-autonomous-agent-draft-v2',
      name: 'Autonomous Marketing Agent Experimental Policy',
      description:
        'Proposed policy to allow marketing content synthesis agent to query customer transcripts for sentiment analytics.',
      version: 2,
      status: 'PENDING_APPROVAL',
      createdBy: 'marketing-lead@company.internal',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      rules: [
        {
          id: 'RULE-DRAFT-01',
          description: 'Permit marketing copy agent to read customer transcripts for sentiment analysis',
          effect: 'ALLOW',
          actions: ['READ', 'INFER'],
          purposes: ['ANALYTICS'],
          workflowScope: ['marketing-copy-generator'],
          dataSourceScope: ['customer-support-transcripts'],
          conditions: [
            {
              name: 'pii_tokenized',
              operator: 'BOOLEAN_TRUE',
              expectedValue: true,
              description: 'PII must be fully redacted before analytics run',
            },
          ],
        },
      ],
    };

    await this.policyRepo.createPolicy(draftPolicy);

    // Approval Request for the draft policy
    const approvalReq: ApprovalRequest = {
      id: 'appr-001',
      policyId: draftPolicy.id,
      policyName: draftPolicy.name,
      policyVersion: draftPolicy.version,
      submittedBy: 'marketing-lead@company.internal',
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      changesSummary:
        'Requests sentiment analysis read permissions on customer transcripts for marketing copy generation.',
    };

    await this.approvalRepo.createApproval(approvalReq);

    // Initial audit records demonstrating hash chaining
    await this.auditRepo.appendRecord({
      id: 'aud-genesis-init',
      timestamp: new Date(Date.now() - 3600000).toISOString(),
      requestId: 'req-init-bootstrap',
      workflowId: 'support-chat-assistant',
      dataSourceId: 'product-documentation-lake',
      action: 'READ',
      purpose: 'RAG_RETRIEVAL',
      decision: 'ALLOW',
      matchedPolicyId: baselinePolicy.id,
      matchedPolicyVersion: 1,
      matchedRuleId: 'RULE-001-ALLOW-SUPPORT-READ',
      rationale: 'Access Permitted: Satisfied all scoping constraints and conditions in baseline policy.',
      isSimulation: true,
      actor: 'system-bootstrapper',
      principal: { userId: 'system', role: 'OPERATOR' },
      contextRedacted: { pii_tokenized: true, user_consent_verified: true },
      conditionsEvaluated: [
        {
          conditionName: 'pii_tokenized',
          operator: 'BOOLEAN_TRUE',
          expected: true,
          actual: true,
          satisfied: true,
          description: 'PII masking/tokenization confirmed',
        },
        {
          conditionName: 'user_consent_verified',
          operator: 'BOOLEAN_TRUE',
          expected: true,
          actual: true,
          satisfied: true,
          description: 'End-user consent verified',
        },
      ],
      missingRequirements: [],
      requestHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    });

    this.logger.log('Seed data successfully initialized.');
  }
}
