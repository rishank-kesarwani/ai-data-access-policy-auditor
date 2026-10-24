import {
  BadRequestException,
  Inject,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  AUDIT_REPOSITORY,
  INVENTORY_REPOSITORY,
  POLICY_REPOSITORY,
} from '../storage/storage.module';
import {
  IAuditRepository,
  IInventoryRepository,
  IPolicyRepository,
} from '../storage/storage.types';
import { PolicyEvaluatorService } from '../policy/policy-evaluator.service';
import { AiPlatformAdapter } from '../integrations/ai-platform.adapter';
import { NotificationAdapter } from '../integrations/notification.adapter';
import { RedisService } from '../integrations/redis.service';
import { HashChainUtil } from '../../common/utils/hash-chain';
import { SanitizerUtil } from '../../common/utils/sanitizer';
import {
  AccessRequest,
  PolicyEvaluationResult,
} from '../../common/types';
import { EvaluateAccessRequestDto } from './dto/access-request.dto';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class AccessRequestService {
  private readonly logger = new Logger(AccessRequestService.name);

  constructor(
    @Inject(INVENTORY_REPOSITORY)
    private readonly inventoryRepo: IInventoryRepository,
    @Inject(POLICY_REPOSITORY)
    private readonly policyRepo: IPolicyRepository,
    @Inject(AUDIT_REPOSITORY)
    private readonly auditRepo: IAuditRepository,
    private readonly policyEvaluator: PolicyEvaluatorService,
    private readonly aiPlatformAdapter: AiPlatformAdapter,
    private readonly notificationAdapter: NotificationAdapter,
    private readonly redisService: RedisService,
  ) {}

  /**
   * Evaluates an access request.
   * If isSimulation is true, records as synthetic test evidence.
   * If isSimulation is false, enforces authorization check.
   */
  async evaluateAccessRequest(
    dto: EvaluateAccessRequestDto,
    actorIdentity: string,
    isAnonymous: boolean = false,
  ): Promise<PolicyEvaluationResult> {
    const isSimulation = Boolean(dto.isSimulation);

    // Public users are strictly restricted to simulation mode only
    if (isAnonymous && !isSimulation) {
      throw new UnauthorizedException(
        'Public unauthenticated access is permitted for synthetic simulations only (isSimulation=true). Real authorization requests require authentication.',
      );
    }

    const requestId = dto.requestId || `req-${uuidv4().substring(0, 8)}`;

    // 1. Fetch referenced entities
    const workflow = await this.inventoryRepo.getWorkflowById(dto.workflowId);
    const dataSource = await this.inventoryRepo.getDataSourceById(dto.dataSourceId);
    const activePolicies = await this.policyRepo.getActivePolicies();

    const requestPayload: AccessRequest = {
      requestId,
      workflowId: dto.workflowId,
      dataSourceId: dto.dataSourceId,
      action: dto.action,
      purpose: dto.purpose,
      principal: dto.principal,
      context: dto.context || {},
      isSimulation,
      notes: dto.notes,
    };

    // 2. Deterministic Policy Evaluation (Always executed independently of AI)
    const evalResult = this.policyEvaluator.evaluate({
      request: requestPayload,
      activePolicies,
      workflow,
      dataSource,
    });

    // 3. Compute deterministic hash of request payload
    const requestHash = HashChainUtil.hashPayload({
      workflowId: dto.workflowId,
      dataSourceId: dto.dataSourceId,
      action: dto.action,
      purpose: dto.purpose,
      principal: dto.principal,
      context: dto.context,
    });

    // 4. Request explainable governance summary from AI Platform (with deterministic fallback)
    const { explanation, generatedByAI } =
      await this.aiPlatformAdapter.generateDecisionExplanation(
        requestPayload,
        evalResult,
      );

    evalResult.aiExplanation = explanation;
    evalResult.aiPlatformUsed = generatedByAI;

    // 5. Append immutable audit record with cryptographic hash chain
    const sanitizedContext = SanitizerUtil.redactSensitiveData(dto.context || {});
    const auditRecordId = `aud-${uuidv4().substring(0, 8)}`;

    const auditEntry = await this.auditRepo.appendRecord({
      id: auditRecordId,
      timestamp: evalResult.evaluatedAt,
      requestId,
      workflowId: dto.workflowId,
      dataSourceId: dto.dataSourceId,
      action: dto.action,
      purpose: dto.purpose,
      decision: evalResult.decision,
      matchedPolicyId: evalResult.matchedPolicyId,
      matchedPolicyVersion: evalResult.matchedPolicyVersion,
      matchedRuleId: evalResult.matchedRuleId,
      rationale: evalResult.rationale,
      isSimulation,
      actor: actorIdentity,
      principal: dto.principal || {},
      contextRedacted: sanitizedContext,
      conditionsEvaluated: evalResult.evaluatedConditions,
      missingRequirements: evalResult.missingRequirements,
      requestHash,
    });

    evalResult.auditRecordId = auditEntry.id;

    // 6. If request is ESCALATED and is a real access request, notify SecOps
    if (evalResult.decision === 'ESCALATE' && !isSimulation) {
      await this.notificationAdapter.sendSecurityAlert({
        title: `AI Data Access ESCALATION: ${dto.workflowId} -> ${dto.dataSourceId}`,
        message: `Workflow '${dto.workflowId}' attempted action '${dto.action}' for purpose '${dto.purpose}'. Deterministic evaluation escalated this request for human security signoff.`,
        severity: 'CRITICAL',
        category: 'ACCESS_ESCALATION',
        details: {
          requestId,
          auditRecordId,
          workflowId: dto.workflowId,
          dataSourceId: dto.dataSourceId,
          rationale: evalResult.rationale,
          missingRequirements: evalResult.missingRequirements,
        },
      });
    }

    this.logger.log(
      `Evaluated access request ${requestId}: Outcome=${evalResult.decision}, Simulation=${isSimulation}, MatchedPolicy=${evalResult.matchedPolicyId || 'None'}`,
    );

    return evalResult;
  }

  /**
   * Returns pre-configured walkthrough scenarios demonstrating ALLOW, DENY, and ESCALATE.
   */
  getWalkthroughScenarios() {
    return [
      {
        scenarioId: 'scenario-allow-compliant-support',
        title: 'Scenario 1: Permitted Customer Support Knowledge Retrieval (ALLOW)',
        description:
          'Customer Support LLM Copilot queries customer support transcripts with confirmed end-user consent and active PII tokenization.',
        expectedOutcome: 'ALLOW',
        request: {
          workflowId: 'support-chat-assistant',
          dataSourceId: 'customer-support-transcripts',
          action: 'READ',
          purpose: 'CUSTOMER_SUPPORT',
          principal: {
            userId: 'agent-bot-01',
            role: 'AI_COPILOT',
            tenantId: 'tenant-enterprise-prod',
            mfaVerified: true,
          },
          context: {
            user_consent_verified: true,
            pii_tokenized: true,
            retention_days: 30,
          },
          isSimulation: true,
          notes: 'Standard authorized support session with all data-protection conditions satisfied.',
        },
      },
      {
        scenarioId: 'scenario-deny-training-on-pii',
        title: 'Scenario 2: Prohibited Model Training on PII Transcripts (DENY)',
        description:
          'Developer Copilot attempts to initiate model training (TRAIN) against confidential customer transcripts. Explicit DENY rule triggers immediately.',
        expectedOutcome: 'DENY',
        request: {
          workflowId: 'code-generation-copilot',
          dataSourceId: 'customer-support-transcripts',
          action: 'TRAIN',
          purpose: 'MODEL_TRAINING',
          principal: {
            userId: 'dev-copilot-daemon',
            role: 'TRAINING_WORKER',
          },
          context: {
            pii_tokenized: false,
            user_consent_verified: false,
          },
          isSimulation: true,
          notes: 'Direct attempt to train on unmasked customer transcripts. Prohibited under enterprise zero-trust policy.',
        },
      },
      {
        scenarioId: 'scenario-escalate-restricted-financial',
        title: 'Scenario 3: High-Risk Ledger Access Escalation (ESCALATE)',
        description:
          'Real-time Payment Anomaly Detector requests access to Core Ledger & Settlement records. High sensitivity classification requires dual-custody SecOps signoff.',
        expectedOutcome: 'ESCALATE',
        request: {
          workflowId: 'financial-fraud-detector',
          dataSourceId: 'financial-transactions-ledger',
          action: 'READ',
          purpose: 'FRAUD_DETECTION',
          principal: {
            userId: 'anomaly-model-prod',
            role: 'RISK_ENGINE',
          },
          context: {
            tenant_boundary_enforced: true,
            mfa_verified: true,
          },
          isSimulation: true,
          notes: 'Legitimate fraud-detection query on PCI-critical ledger; routed to SecOps approval queue.',
        },
      },
      {
        scenarioId: 'scenario-deny-missing-conditions',
        title: 'Scenario 4: Missing Required Conditions (DENY)',
        description:
          'Support Copilot attempts to access transcripts, but end-user consent was not gathered (user_consent_verified: false).',
        expectedOutcome: 'DENY',
        request: {
          workflowId: 'support-chat-assistant',
          dataSourceId: 'customer-support-transcripts',
          action: 'READ',
          purpose: 'CUSTOMER_SUPPORT',
          principal: {
            userId: 'support-bot-guest',
          },
          context: {
            user_consent_verified: false,
            pii_tokenized: true,
          },
          isSimulation: true,
          notes: 'Consent verification failed. Policy requires explicit end-user consent.',
        },
      },
      {
        scenarioId: 'scenario-deny-unknown-resource',
        title: 'Scenario 5: Unknown Target Resource Default-Deny (DENY)',
        description:
          'Workflow queries an uncataloged shadow database (unregistered-user-analytics-db). Safe default-deny prevents untracked data exposure.',
        expectedOutcome: 'DENY',
        request: {
          workflowId: 'support-chat-assistant',
          dataSourceId: 'unregistered-shadow-database-v2',
          action: 'READ',
          purpose: 'ANALYTICS',
          context: {},
          isSimulation: true,
          notes: 'Unregistered data asset blocked by safe default-deny rule.',
        },
      },
    ];
  }
}
