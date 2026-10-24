import {
  BadRequestException,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import {
  APPROVAL_REPOSITORY,
  POLICY_REPOSITORY,
} from '../storage/storage.module';
import {
  IApprovalRepository,
  IPolicyRepository,
} from '../storage/storage.types';
import { ApprovalRequest, Policy } from '../../common/types';
import { CreatePolicyDto, SubmitApprovalDto } from './dto/policy.dto';
import { NotificationAdapter } from '../integrations/notification.adapter';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class PolicyService {
  constructor(
    @Inject(POLICY_REPOSITORY)
    private readonly policyRepo: IPolicyRepository,
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepo: IApprovalRepository,
    private readonly notificationAdapter: NotificationAdapter,
  ) {}

  async getAllPolicies(): Promise<Policy[]> {
    return this.policyRepo.getAllPolicies();
  }

  async getActivePolicies(): Promise<Policy[]> {
    return this.policyRepo.getActivePolicies();
  }

  async getPolicyById(id: string): Promise<Policy> {
    const policy = await this.policyRepo.getPolicyById(id);
    if (!policy) {
      throw new NotFoundException(`Policy with ID '${id}' not found`);
    }
    return policy;
  }

  async getPolicyVersions(id: string): Promise<Policy[]> {
    return this.policyRepo.getPolicyVersions(id);
  }

  async createPolicy(dto: CreatePolicyDto, userEmail: string): Promise<Policy> {
    const existing = await this.policyRepo.getPolicyById(dto.id);
    if (existing) {
      throw new BadRequestException(`Policy with ID '${dto.id}' already exists`);
    }

    const newPolicy: Policy = {
      id: dto.id,
      name: dto.name,
      description: dto.description,
      version: dto.version || 1,
      status: dto.status || 'DRAFT',
      rules: (dto.rules as any) || [],
      createdBy: userEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.policyRepo.createPolicy(newPolicy);
  }

  async createNewVersion(
    basePolicyId: string,
    dto: Partial<CreatePolicyDto>,
    userEmail: string,
  ): Promise<Policy> {
    const basePolicy = await this.getPolicyById(basePolicyId);

    const nextVersion = basePolicy.version + 1;
    const versionedId = `${basePolicy.id.replace(/-v\d+$/, '')}-v${nextVersion}`;

    const newVersionPolicy: Policy = {
      id: versionedId,
      name: dto.name || basePolicy.name,
      description: dto.description || basePolicy.description,
      version: nextVersion,
      status: 'DRAFT',
      rules: (dto.rules as any) || basePolicy.rules,
      createdBy: userEmail,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    return this.policyRepo.createPolicy(newVersionPolicy);
  }

  async updatePolicy(id: string, dto: Partial<CreatePolicyDto>): Promise<Policy> {
    const existing = await this.getPolicyById(id);

    if (existing.status === 'ACTIVE') {
      throw new BadRequestException(
        'Cannot directly edit an ACTIVE policy. Create a new version (DRAFT) to make modifications.',
      );
    }

    const updated = await this.policyRepo.updatePolicy(id, {
      ...dto,
      rules: dto.rules as any,
    });

    if (!updated) {
      throw new NotFoundException(`Policy with ID '${id}' not found`);
    }

    return updated;
  }

  async submitForApproval(
    id: string,
    dto: SubmitApprovalDto,
    userEmail: string,
  ): Promise<ApprovalRequest> {
    const policy = await this.getPolicyById(id);

    if (policy.status === 'ACTIVE') {
      throw new BadRequestException('Policy is already active');
    }

    if (policy.status === 'PENDING_APPROVAL') {
      throw new BadRequestException('Policy is already submitted for approval');
    }

    // Set status to PENDING_APPROVAL
    await this.policyRepo.updatePolicy(id, { status: 'PENDING_APPROVAL' });

    const approvalReq: ApprovalRequest = {
      id: `appr-${uuidv4().substring(0, 8)}`,
      policyId: policy.id,
      policyName: policy.name,
      policyVersion: policy.version,
      submittedBy: userEmail,
      submittedAt: new Date().toISOString(),
      status: 'PENDING',
      changesSummary: dto.changesSummary,
    };

    const saved = await this.approvalRepo.createApproval(approvalReq);

    // Dispatch alert to SecOps via Railway Notification Service
    await this.notificationAdapter.sendSecurityAlert({
      title: `Policy Approval Required: ${policy.name} (v${policy.version})`,
      message: `User '${userEmail}' has submitted a policy revision for approval.\nSummary of changes: ${dto.changesSummary}`,
      severity: 'CRITICAL',
      category: 'POLICY_APPROVAL',
      details: {
        approvalId: saved.id,
        policyId: policy.id,
        policyName: policy.name,
        version: policy.version,
        submittedBy: userEmail,
      },
    });

    return saved;
  }

  async deletePolicy(id: string): Promise<boolean> {
    const policy = await this.getPolicyById(id);
    if (policy.status === 'ACTIVE') {
      throw new BadRequestException('Cannot delete an ACTIVE policy. Decommission or archive it first.');
    }
    return this.policyRepo.deletePolicy(id);
  }
}
