import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';
import { AccessRequest, PolicyEvaluationResult } from '../../common/types';

@Injectable()
export class AiPlatformAdapter {
  private readonly logger = new Logger(AiPlatformAdapter.name);

  constructor(private readonly configService: ConfigService) {}

  /**
   * Requests an explainable governance summary from the Railway AI Platform.
   * If the service is unreachable or unconfigured, gracefully falls back to deterministic summary.
   * Note: This AI output is purely descriptive and CANNOT override the deterministic authorization engine!
   */
  async generateDecisionExplanation(
    request: AccessRequest,
    evalResult: PolicyEvaluationResult,
  ): Promise<{ explanation: string; generatedByAI: boolean }> {
    const aiUrl = this.configService.get<string>('aiPlatform.url');
    const aiKey = this.configService.get<string>('aiPlatform.apiKey');

    if (aiUrl && aiKey && aiKey.trim().length > 0) {
      try {
        this.logger.log(`Calling Shared Railway AI Platform at ${aiUrl}/api/v1/ai/chat`);

        const promptMessage = `Please provide a clear, professional security-governance summary for the following access request decision:
- Workflow: ${request.workflowId}
- Target Data Source: ${request.dataSourceId}
- Action Requested: ${request.action}
- Business Purpose: ${request.purpose}
- Deterministic Decision: ${evalResult.decision}
- Matched Policy: ${evalResult.matchedPolicyName || 'None (Default Deny)'} (v${evalResult.matchedPolicyVersion || 'N/A'})
- Matched Rule: ${evalResult.matchedRuleId || 'Default Rule'}
- Deterministic Rationale: ${evalResult.rationale}
- Missing Requirements: ${evalResult.missingRequirements.join(', ') || 'None'}
- Context Attributes: ${JSON.stringify(request.context || {})}
Please summarize:
1) Key risk considerations
2) Why this decision (${evalResult.decision}) was deterministically reached
3) Remediation advice if denied or escalation next steps if escalated.`;

        const response = await axios.post(
          `${aiUrl.replace(/\/+$/, '')}/api/v1/ai/chat`,
          {
            applicationId: 'ai-data-access-policy-auditor',
            tenantId: 'security-governance',
            message: promptMessage,
            systemInstruction:
              'You are a Senior Application Security & Authorization Governance Specialist. Explain access evaluation outcomes clearly, highlighting compliance, least-privilege, and data sensitivity. Keep it concise, executive, and objective. Never claim to change the decision.',
          },
          {
            headers: {
              'x-api-key': aiKey,
              'Content-Type': 'application/json',
            },
            timeout: 6000,
          },
        );

        if (response.data && (response.data.text || response.data.response || response.data.data?.response)) {
          const text =
            response.data.text ||
            response.data.response ||
            response.data.data?.response;
          return { explanation: text, generatedByAI: true };
        }
      } catch (err: any) {
        this.logger.warn(
          `AI Platform request failed (${err.message}). Seamlessly engaging built-in deterministic explanation generator.`,
        );
      }
    }

    // Deterministic Rule-Based Fallback Explanation
    return {
      explanation: this.generateDeterministicExplanation(request, evalResult),
      generatedByAI: false,
    };
  }

  private generateDeterministicExplanation(
    request: AccessRequest,
    evalResult: PolicyEvaluationResult,
  ): string {
    const isEscalate = evalResult.decision === 'ESCALATE';
    const isDeny = evalResult.decision === 'DENY';
    const isAllow = evalResult.decision === 'ALLOW';

    let breakdown = `[Deterministic Policy Rationale]\n`;
    breakdown += `Decision: ${evalResult.decision}\n`;

    if (evalResult.matchedPolicyName) {
      breakdown += `Matched Policy: "${evalResult.matchedPolicyName}" (v${evalResult.matchedPolicyVersion}) - Rule ID: ${evalResult.matchedRuleId || 'N/A'}\n`;
    } else {
      breakdown += `No permissive policy matched this request. Evaluated under the Safe Default-Deny rule.\n`;
    }

    breakdown += `Rationale: ${evalResult.rationale}\n`;

    if (evalResult.missingRequirements.length > 0) {
      breakdown += `Missing Conditions / Requirements:\n${evalResult.missingRequirements.map((r) => `  - ${r}`).join('\n')}\n`;
    }

    if (isAllow) {
      breakdown += `\nVerification Summary: All explicit conditions, scoping limits, and data protection requirements have been satisfied. Workflow '${request.workflowId}' is authorized to execute '${request.action}' on '${request.dataSourceId}' for purpose '${request.purpose}'.`;
    } else if (isEscalate) {
      breakdown += `\nEscalation Guidance: This action touches high-sensitivity data or restricted operations. The request has been routed to the Security Operations & Privacy review queue. External notifications have been dispatched to authorized reviewers.`;
    } else if (isDeny) {
      breakdown += `\nRemediation Guidance: Access is prohibited under zero-trust governance. To request authorization, ensure all mandatory privacy conditions are fulfilled and submit a policy update request for SecOps approval.`;
    }

    return breakdown;
  }
}
