import { Injectable, Logger } from '@nestjs/common';
import {
  AccessRequest,
  ConditionEvaluationResult,
  DataSource,
  DecisionOutcome,
  Policy,
  PolicyCondition,
  PolicyEvaluationResult,
  PolicyRule,
  Workflow,
} from '../../common/types';

@Injectable()
export class PolicyEvaluatorService {
  private readonly logger = new Logger(PolicyEvaluatorService.name);

  /**
   * Deterministically evaluates an access request against active policies.
   *
   * Precedence:
   * 1. Unknown or inactive workflow/dataSource -> DENY (Unknown resource safe rule)
   * 2. Explicit DENY rule match -> DENY (Deny overrides Allow)
   * 3. Explicit ESCALATE rule match -> ESCALATE (Requires SecOps review)
   * 4. Explicit ALLOW rule match with condition verification:
   *    - If all mandatory conditions pass -> ALLOW
   *    - If condition check requires human escalation -> ESCALATE
   *    - If any mandatory condition fails -> DENY
   * 5. No permissive rule matched -> DENY (Safe Default-Deny rule)
   */
  evaluate(params: {
    request: AccessRequest;
    activePolicies: Policy[];
    workflow: Workflow | null;
    dataSource: DataSource | null;
  }): PolicyEvaluationResult {
    const { request, activePolicies, workflow, dataSource } = params;
    const evaluatedAt = new Date().toISOString();
    const requestId = request.requestId || `req-${Date.now()}`;
    const isSimulation = Boolean(request.isSimulation);

    // 1. Guard against unknown or inactive resources
    if (!workflow) {
      return {
        decision: 'DENY',
        matchedPolicyId: null,
        matchedPolicyName: null,
        matchedPolicyVersion: null,
        matchedRuleId: null,
        matchedRuleEffect: 'DENY',
        rationale: `Access Denied: Target AI workflow '${request.workflowId}' is not registered in the system registry or has been decommissioned.`,
        evaluatedConditions: [],
        missingRequirements: [`Workflow '${request.workflowId}' must be registered and active`],
        aiPlatformUsed: false,
        evaluatedAt,
        isSimulation,
        requestId,
      };
    }

    if (!workflow.active) {
      return {
        decision: 'DENY',
        matchedPolicyId: null,
        matchedPolicyName: null,
        matchedPolicyVersion: null,
        matchedRuleId: null,
        matchedRuleEffect: 'DENY',
        rationale: `Access Denied: AI workflow '${workflow.name}' (${workflow.id}) is marked as INACTIVE.`,
        evaluatedConditions: [],
        missingRequirements: ['Workflow must be in ACTIVE operational state'],
        aiPlatformUsed: false,
        evaluatedAt,
        isSimulation,
        requestId,
      };
    }

    if (!dataSource) {
      return {
        decision: 'DENY',
        matchedPolicyId: null,
        matchedPolicyName: null,
        matchedPolicyVersion: null,
        matchedRuleId: null,
        matchedRuleEffect: 'DENY',
        rationale: `Access Denied: Target data source '${request.dataSourceId}' is not registered in the catalog. Safe default-deny prevents access to uncataloged assets.`,
        evaluatedConditions: [],
        missingRequirements: [`Data source '${request.dataSourceId}' must be cataloged`],
        aiPlatformUsed: false,
        evaluatedAt,
        isSimulation,
        requestId,
      };
    }

    // High-risk safety check: Restrict raw training on Restricted PII or Health datasets without explicit escalation
    const isSensitiveData =
      dataSource.sensitivity === 'RESTRICTED_PII' ||
      dataSource.sensitivity === 'RESTRICTED_HEALTH' ||
      dataSource.sensitivity === 'RESTRICTED_FINANCIAL';

    const isHighRiskAction =
      request.action === 'TRAIN' ||
      request.action === 'FINE_TUNE' ||
      request.action === 'EXPORT';

    // Collect all candidate matching rules across all active policies
    interface CandidateRule {
      policy: Policy;
      rule: PolicyRule;
    }

    const matchingDenyRules: CandidateRule[] = [];
    const matchingEscalateRules: CandidateRule[] = [];
    const matchingAllowRules: CandidateRule[] = [];

    for (const policy of activePolicies) {
      for (const rule of policy.rules || []) {
        if (this.doesRuleMatch(rule, request, workflow, dataSource)) {
          if (rule.effect === 'DENY') {
            matchingDenyRules.push({ policy, rule });
          } else if (rule.effect === 'ESCALATE') {
            matchingEscalateRules.push({ policy, rule });
          } else if (rule.effect === 'ALLOW') {
            matchingAllowRules.push({ policy, rule });
          }
        }
      }
    }

    // 2. Explicit DENY overrides ALL (Security Principle: Deny by Precedence)
    if (matchingDenyRules.length > 0) {
      const match = matchingDenyRules[0];
      const conditionResults = this.evaluateConditions(match.rule.conditions, request);
      const unmet = conditionResults.filter((c) => !c.satisfied).map((c) => c.description);

      return {
        decision: 'DENY',
        matchedPolicyId: match.policy.id,
        matchedPolicyName: match.policy.name,
        matchedPolicyVersion: match.policy.version,
        matchedRuleId: match.rule.id,
        matchedRuleEffect: 'DENY',
        rationale: `Access Denied: Explicit prohibition triggered by policy "${match.policy.name}" (Rule ${match.rule.id}: ${match.rule.description}). Explicit DENY rules override all permissive rules.`,
        evaluatedConditions: conditionResults,
        missingRequirements: unmet,
        aiPlatformUsed: false,
        evaluatedAt,
        isSimulation,
        requestId,
      };
    }

    // 3. High-Risk Action Guard: If high-risk action on restricted data and not already escalated, force ESCALATE
    if (isSensitiveData && isHighRiskAction && !request.context?.secopsOverrideToken) {
      // If there's an explicit escalate rule, prioritize its rationale
      const escalateMatch = matchingEscalateRules[0];
      return {
        decision: 'ESCALATE',
        matchedPolicyId: escalateMatch ? escalateMatch.policy.id : null,
        matchedPolicyName: escalateMatch ? escalateMatch.policy.name : 'Enterprise AI Data Protection Baseline',
        matchedPolicyVersion: escalateMatch ? escalateMatch.policy.version : 1,
        matchedRuleId: escalateMatch ? escalateMatch.rule.id : 'BASELINE-HIGH-RISK-ESCALATE',
        matchedRuleEffect: 'ESCALATE',
        rationale: `Access Escalated for Security Review: Request attempts high-risk action '${request.action}' against sensitivity tier '${dataSource.sensitivity}'. High-risk model training or export on restricted assets strictly requires manual SecOps authorization.`,
        evaluatedConditions: [
          {
            conditionName: 'secops_manual_signoff',
            operator: 'BOOLEAN_TRUE',
            expected: true,
            actual: false,
            satisfied: false,
            description: 'Manual SecOps privacy approval required for high-risk operations on sensitive datasets',
          },
        ],
        missingRequirements: [
          `Dual-custody authorization required for '${request.action}' on '${dataSource.sensitivity}' data`,
        ],
        aiPlatformUsed: false,
        evaluatedAt,
        isSimulation,
        requestId,
      };
    }

    // 4. Explicit ESCALATE Rules
    if (matchingEscalateRules.length > 0) {
      const match = matchingEscalateRules[0];
      const conditionResults = this.evaluateConditions(match.rule.conditions, request);
      const unmet = conditionResults.filter((c) => !c.satisfied).map((c) => c.description);

      return {
        decision: 'ESCALATE',
        matchedPolicyId: match.policy.id,
        matchedPolicyName: match.policy.name,
        matchedPolicyVersion: match.policy.version,
        matchedRuleId: match.rule.id,
        matchedRuleEffect: 'ESCALATE',
        rationale: `Access Escalated: Policy "${match.policy.name}" (Rule ${match.rule.id}) specifies human review is required: ${match.rule.escalationReason || match.rule.description}`,
        evaluatedConditions: conditionResults,
        missingRequirements: unmet,
        aiPlatformUsed: false,
        evaluatedAt,
        isSimulation,
        requestId,
      };
    }

    // 5. Evaluate ALLOW Rules with full Condition checks
    if (matchingAllowRules.length > 0) {
      for (const match of matchingAllowRules) {
        const conditionResults = this.evaluateConditions(match.rule.conditions, request);
        const unmetConditions = conditionResults.filter((c) => !c.satisfied);

        if (unmetConditions.length === 0) {
          // All conditions fulfilled -> ALLOW
          return {
            decision: 'ALLOW',
            matchedPolicyId: match.policy.id,
            matchedPolicyName: match.policy.name,
            matchedPolicyVersion: match.policy.version,
            matchedRuleId: match.rule.id,
            matchedRuleEffect: 'ALLOW',
            rationale: `Access Permitted: Satisfied all scoping constraints and conditions in policy "${match.policy.name}" (Rule ${match.rule.id}).`,
            evaluatedConditions: conditionResults,
            missingRequirements: [],
            aiPlatformUsed: false,
            evaluatedAt,
            isSimulation,
            requestId,
          };
        } else {
          // Rule matched scope, but mandatory conditions failed!
          // If the failed condition is an escalation-eligible condition (e.g. tenant boundary or retention limit), evaluate if it should escalate or deny
          const missingDescriptions = unmetConditions.map((c) => c.description);
          return {
            decision: 'DENY',
            matchedPolicyId: match.policy.id,
            matchedPolicyName: match.policy.name,
            matchedPolicyVersion: match.policy.version,
            matchedRuleId: match.rule.id,
            matchedRuleEffect: 'ALLOW',
            rationale: `Access Denied: Matched policy "${match.policy.name}" (Rule ${match.rule.id}), but mandatory authorization conditions were not satisfied.`,
            evaluatedConditions: conditionResults,
            missingRequirements: missingDescriptions,
            aiPlatformUsed: false,
            evaluatedAt,
            isSimulation,
            requestId,
          };
        }
      }
    }

    // 6. Safe Default-Deny Rule
    return {
      decision: 'DENY',
      matchedPolicyId: null,
      matchedPolicyName: null,
      matchedPolicyVersion: null,
      matchedRuleId: null,
      matchedRuleEffect: null,
      rationale: `Access Denied: Safe Default-Deny. No active authorization policy permits workflow '${workflow.name}' to perform '${request.action}' on '${dataSource.name}' for purpose '${request.purpose}'.`,
      evaluatedConditions: [],
      missingRequirements: [
        `Explicit policy rule granting '${request.action}' on '${request.dataSourceId}' for workflow '${request.workflowId}'`,
      ],
      aiPlatformUsed: false,
      evaluatedAt,
      isSimulation,
      requestId,
    };
  }

  /**
   * Evaluates if a given policy rule matches the request scope.
   */
  private doesRuleMatch(
    rule: PolicyRule,
    request: AccessRequest,
    workflow: Workflow,
    dataSource: DataSource,
  ): boolean {
    // 1. Action matching
    const actionMatches =
      rule.actions.includes('*') || rule.actions.includes(request.action);
    if (!actionMatches) return false;

    // 2. Purpose matching
    const purposeMatches =
      rule.purposes.includes('*') || rule.purposes.includes(request.purpose);
    if (!purposeMatches) return false;

    // 3. Workflow scope matching
    const workflowMatches =
      rule.workflowScope.includes('*') ||
      rule.workflowScope.includes(request.workflowId) ||
      rule.workflowScope.includes(workflow.id);
    if (!workflowMatches) return false;

    // 4. Data source scope matching (supports exact ID, wildcard '*', or glob prefix e.g. 'customer-*')
    const dataSourceMatches = rule.dataSourceScope.some((pattern) => {
      if (pattern === '*') return true;
      if (pattern === request.dataSourceId || pattern === dataSource.id) return true;
      if (pattern.endsWith('*')) {
        const prefix = pattern.slice(0, -1);
        return request.dataSourceId.startsWith(prefix);
      }
      return false;
    });
    if (!dataSourceMatches) return false;

    // 5. Sensitivity scope matching (if specified)
    if (rule.sensitivityScope && rule.sensitivityScope.length > 0) {
      if (!rule.sensitivityScope.includes(dataSource.sensitivity)) {
        return false;
      }
    }

    return true;
  }

  /**
   * Evaluates the list of conditions configured on a rule.
   */
  private evaluateConditions(
    conditions: PolicyCondition[],
    request: AccessRequest,
  ): ConditionEvaluationResult[] {
    if (!conditions || conditions.length === 0) {
      return [];
    }

    const context = request.context || {};
    const results: ConditionEvaluationResult[] = [];

    for (const cond of conditions) {
      const actualValue = context[cond.name];
      let satisfied = false;

      switch (cond.operator) {
        case 'BOOLEAN_TRUE':
          satisfied = actualValue === true || actualValue === 'true';
          break;

        case 'EQUALS':
          satisfied = actualValue === cond.expectedValue;
          break;

        case 'NOT_EQUALS':
          satisfied = actualValue !== cond.expectedValue;
          break;

        case 'IN':
          if (Array.isArray(cond.expectedValue)) {
            satisfied = cond.expectedValue.includes(actualValue);
          }
          break;

        case 'LESS_THAN_OR_EQUAL':
          satisfied =
            actualValue !== undefined &&
            actualValue !== null &&
            Number(actualValue) <= Number(cond.expectedValue);
          break;

        case 'GREATER_THAN_OR_EQUAL':
          satisfied =
            actualValue !== undefined &&
            actualValue !== null &&
            Number(actualValue) >= Number(cond.expectedValue);
          break;

        default:
          satisfied = false;
      }

      results.push({
        conditionName: cond.name,
        operator: cond.operator,
        expected: cond.expectedValue,
        actual: actualValue,
        satisfied,
        description:
          cond.description ||
          `Condition '${cond.name}' requires operator '${cond.operator}' with expected value ${JSON.stringify(cond.expectedValue)}`,
      });
    }

    return results;
  }
}
