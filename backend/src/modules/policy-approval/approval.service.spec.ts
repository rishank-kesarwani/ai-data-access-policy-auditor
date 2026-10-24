import { ApprovalService } from './approval.service';
import { IApprovalRepository, IPolicyRepository } from '../storage/storage.types';
import { NotificationAdapter } from '../integrations/notification.adapter';
import { ApprovalRequest, Policy } from '../../common/types';

describe('ApprovalService', () => {
  let service: ApprovalService;
  let mockApprovalRepo: Partial<IApprovalRepository>;
  let mockPolicyRepo: Partial<IPolicyRepository>;
  let mockNotificationAdapter: Partial<NotificationAdapter>;

  const samplePolicy: Policy = {
    id: 'pol-customer-v2',
    name: 'Customer Transcripts AI Policy',
    description: 'Updated draft rules',
    version: 2,
    status: 'PENDING_APPROVAL',
    createdBy: 'operator@secops.internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules: [],
  };

  const oldActivePolicy: Policy = {
    id: 'pol-customer-v1',
    name: 'Customer Transcripts AI Policy',
    description: 'Initial rules',
    version: 1,
    status: 'ACTIVE',
    createdBy: 'operator@secops.internal',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    rules: [],
  };

  const sampleApproval: ApprovalRequest = {
    id: 'appr-101',
    policyId: 'pol-customer-v2',
    policyName: 'Customer Transcripts AI Policy',
    policyVersion: 2,
    submittedBy: 'operator@secops.internal',
    submittedAt: new Date().toISOString(),
    status: 'PENDING',
    changesSummary: 'Add sentiment analysis rule',
  };

  beforeEach(() => {
    mockApprovalRepo = {
      getApprovalById: jest.fn().mockResolvedValue(sampleApproval),
      updateApproval: jest.fn().mockImplementation((id, update) =>
        Promise.resolve({ ...sampleApproval, ...update }),
      ),
    };

    mockPolicyRepo = {
      getPolicyById: jest.fn().mockResolvedValue(samplePolicy),
      getPolicyVersions: jest
        .fn()
        .mockResolvedValue([oldActivePolicy, samplePolicy]),
      updatePolicy: jest.fn().mockResolvedValue(samplePolicy),
    };

    mockNotificationAdapter = {
      sendSecurityAlert: jest.fn().mockResolvedValue(true),
    };

    service = new ApprovalService(
      mockApprovalRepo as IApprovalRepository,
      mockPolicyRepo as IPolicyRepository,
      mockNotificationAdapter as NotificationAdapter,
    );
  });

  it('should activate approved policy and archive previous active versions', async () => {
    const result = await service.reviewApproval(
      'appr-101',
      {
        decision: 'APPROVE',
        reviewNotes: 'Verified compliant with privacy framework',
      },
      'ciso@secops.internal',
    );

    expect(result.status).toBe('APPROVED');
    expect(result.reviewedBy).toBe('ciso@secops.internal');

    // Verify old active version was archived
    expect(mockPolicyRepo.updatePolicy).toHaveBeenCalledWith('pol-customer-v1', {
      status: 'ARCHIVED',
    });

    // Verify new policy was activated
    expect(mockPolicyRepo.updatePolicy).toHaveBeenCalledWith('pol-customer-v2', {
      status: 'ACTIVE',
      approvedBy: 'ciso@secops.internal',
      approvalNotes: 'Verified compliant with privacy framework',
    });

    // Verify notification was dispatched
    expect(mockNotificationAdapter.sendSecurityAlert).toHaveBeenCalledWith(
      expect.objectContaining({
        category: 'POLICY_APPROVAL',
        severity: 'BULK',
      }),
    );
  });

  it('should mark policy as REJECTED when reviewer rejects the proposal', async () => {
    const result = await service.reviewApproval(
      'appr-101',
      {
        decision: 'REJECT',
        reviewNotes: 'Risk of PII leakage unmitigated',
      },
      'ciso@secops.internal',
    );

    expect(result.status).toBe('REJECTED');
    expect(mockPolicyRepo.updatePolicy).toHaveBeenCalledWith('pol-customer-v2', {
      status: 'REJECTED',
      approvalNotes: 'Risk of PII leakage unmitigated',
    });
  });
});
