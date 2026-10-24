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
import { ApprovalRequest } from '../../common/types';
import { ReviewApprovalDto } from './dto/review-approval.dto';
import { NotificationAdapter } from '../integrations/notification.adapter';

@Injectable()
export class ApprovalService {
  constructor(
    @Inject(APPROVAL_REPOSITORY)
    private readonly approvalRepo: IApprovalRepository,
    @Inject(POLICY_REPOSITORY)
    private readonly policyRepo: IPolicyRepository,
    private readonly notificationAdapter: NotificationAdapter,
  ) {}

  async getAllApprovals(): Promise<ApprovalRequest[]> {
    return this.approvalRepo.getAllApprovals();
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    return this.approvalRepo.getPendingApprovals();
  }

  async getApprovalById(id: string): Promise<ApprovalRequest> {
    const item = await this.approvalRepo.getApprovalById(id);
    if (!item) {
      throw new NotFoundException(`Approval request with ID '${id}' not found`);
    }
    return item;
  }

  async reviewApproval(
    id: string,
    dto: ReviewApprovalDto,
    reviewerEmail: string,
  ): Promise<ApprovalRequest> {
    const approval = await this.getApprovalById(id);

    if (approval.status !== 'PENDING') {
      throw new BadRequestException(
        `Approval request is already in '${approval.status}' state and cannot be reviewed again.`,
      );
    }

    const reviewedAt = new Date().toISOString();
    const isApproved = dto.decision === 'APPROVE';

    const policy = await this.policyRepo.getPolicyById(approval.policyId);
    if (!policy) {
      throw new NotFoundException(
        `Underlying policy '${approval.policyId}' associated with approval was not found.`,
      );
    }

    if (isApproved) {
      // Find any currently active versions of this policy family and archive them
      const versions = await this.policyRepo.getPolicyVersions(policy.id);
      for (const v of versions) {
        if (v.status === 'ACTIVE' && v.id !== policy.id) {
          await this.policyRepo.updatePolicy(v.id, { status: 'ARCHIVED' });
        }
      }

      // Activate the reviewed policy
      await this.policyRepo.updatePolicy(policy.id, {
        status: 'ACTIVE',
        approvedBy: reviewerEmail,
        approvalNotes: dto.reviewNotes,
      });
    } else {
      // Mark policy as REJECTED
      await this.policyRepo.updatePolicy(policy.id, {
        status: 'REJECTED',
        approvalNotes: dto.reviewNotes,
      });
    }

    // Update approval request
    const updatedApproval = await this.approvalRepo.updateApproval(id, {
      status: isApproved ? 'APPROVED' : 'REJECTED',
      reviewedBy: reviewerEmail,
      reviewedAt,
      reviewNotes: dto.reviewNotes,
    });

    // Send notification
    await this.notificationAdapter.sendSecurityAlert({
      title: `Policy Review Decision: ${policy.name} (v${policy.version}) - ${dto.decision}`,
      message: `Reviewer '${reviewerEmail}' has ${dto.decision.toLowerCase()}d policy '${policy.name}'.\nNotes: ${dto.reviewNotes}`,
      severity: isApproved ? 'BULK' : 'CRITICAL',
      category: 'POLICY_APPROVAL',
      details: {
        approvalId: id,
        policyId: policy.id,
        decision: dto.decision,
        reviewedBy: reviewerEmail,
        reviewedAt,
      },
    });

    return updatedApproval!;
  }
}
