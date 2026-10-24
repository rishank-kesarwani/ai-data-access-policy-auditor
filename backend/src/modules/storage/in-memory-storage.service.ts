import { Injectable, Logger } from '@nestjs/common';
import {
  AuditRecord,
  DataSource,
  Policy,
  Workflow,
  ApprovalRequest,
  AuditVerificationReport,
} from '../../common/types';
import { GENESIS_HASH } from '../../common/constants';
import { HashChainUtil } from '../../common/utils/hash-chain';
import {
  IApprovalRepository,
  IAuditRepository,
  IInventoryRepository,
  IPolicyRepository,
} from './storage.types';

@Injectable()
export class InMemoryStorageService
  implements
    IInventoryRepository,
    IPolicyRepository,
    IApprovalRepository,
    IAuditRepository
{
  private readonly logger = new Logger(InMemoryStorageService.name);

  private readonly workflows = new Map<string, Workflow>();
  private readonly dataSources = new Map<string, DataSource>();
  private readonly policies = new Map<string, Policy>();
  private readonly approvals = new Map<string, ApprovalRequest>();
  private readonly auditRecords: AuditRecord[] = [];

  // ==================== WORKFLOWS ====================
  async getWorkflows(): Promise<Workflow[]> {
    return Array.from(this.workflows.values());
  }

  async getWorkflowById(id: string): Promise<Workflow | null> {
    return this.workflows.get(id) || null;
  }

  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    this.workflows.set(workflow.id, { ...workflow });
    return this.workflows.get(workflow.id)!;
  }

  async updateWorkflow(id: string, update: Partial<Workflow>): Promise<Workflow | null> {
    const existing = this.workflows.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
    this.workflows.set(id, updated);
    return updated;
  }

  // ==================== DATA SOURCES ====================
  async getDataSources(): Promise<DataSource[]> {
    return Array.from(this.dataSources.values());
  }

  async getDataSourceById(id: string): Promise<DataSource | null> {
    return this.dataSources.get(id) || null;
  }

  async createDataSource(dataSource: DataSource): Promise<DataSource> {
    this.dataSources.set(dataSource.id, { ...dataSource });
    return this.dataSources.get(dataSource.id)!;
  }

  async updateDataSource(id: string, update: Partial<DataSource>): Promise<DataSource | null> {
    const existing = this.dataSources.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
    this.dataSources.set(id, updated);
    return updated;
  }

  // ==================== POLICIES ====================
  async getAllPolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values());
  }

  async getActivePolicies(): Promise<Policy[]> {
    return Array.from(this.policies.values()).filter((p) => p.status === 'ACTIVE');
  }

  async getPolicyById(id: string): Promise<Policy | null> {
    return this.policies.get(id) || null;
  }

  async getPolicyVersions(id: string): Promise<Policy[]> {
    const base = this.policies.get(id);
    if (!base) return [];
    // Return policies sharing the same base identifier or name
    return Array.from(this.policies.values()).filter(
      (p) => p.id === id || p.name === base.name,
    );
  }

  async createPolicy(policy: Policy): Promise<Policy> {
    this.policies.set(policy.id, { ...policy });
    return this.policies.get(policy.id)!;
  }

  async updatePolicy(id: string, update: Partial<Policy>): Promise<Policy | null> {
    const existing = this.policies.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update, updatedAt: new Date().toISOString() };
    this.policies.set(id, updated);
    return updated;
  }

  async deletePolicy(id: string): Promise<boolean> {
    return this.policies.delete(id);
  }

  // ==================== APPROVALS ====================
  async getAllApprovals(): Promise<ApprovalRequest[]> {
    return Array.from(this.approvals.values()).sort(
      (a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime(),
    );
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    return Array.from(this.approvals.values())
      .filter((a) => a.status === 'PENDING')
      .sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime());
  }

  async getApprovalById(id: string): Promise<ApprovalRequest | null> {
    return this.approvals.get(id) || null;
  }

  async createApproval(approval: ApprovalRequest): Promise<ApprovalRequest> {
    this.approvals.set(approval.id, { ...approval });
    return this.approvals.get(approval.id)!;
  }

  async updateApproval(id: string, update: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    const existing = this.approvals.get(id);
    if (!existing) return null;
    const updated = { ...existing, ...update };
    this.approvals.set(id, updated);
    return updated;
  }

  // ==================== AUDIT RECORDS (IMMUTABLE HASH CHAIN) ====================
  async appendRecord(
    recordData: Omit<AuditRecord, 'sequenceNumber' | 'previousRecordHash' | 'recordHash'>,
  ): Promise<AuditRecord> {
    const latest = await this.getLatestRecord();
    const sequenceNumber = latest ? latest.sequenceNumber + 1 : 1;
    const previousRecordHash = latest ? latest.recordHash : GENESIS_HASH;

    const recordHash = HashChainUtil.calculateRecordHash({
      previousRecordHash,
      id: recordData.id,
      sequenceNumber,
      timestamp: recordData.timestamp,
      decision: recordData.decision,
      isSimulation: recordData.isSimulation,
      requestHash: recordData.requestHash,
      matchedPolicyId: recordData.matchedPolicyId,
    });

    const completeRecord: AuditRecord = {
      ...recordData,
      sequenceNumber,
      previousRecordHash,
      recordHash,
    };

    // Immutable append
    this.auditRecords.push(completeRecord);
    return completeRecord;
  }

  async getLatestRecord(): Promise<AuditRecord | null> {
    if (this.auditRecords.length === 0) return null;
    return this.auditRecords[this.auditRecords.length - 1];
  }

  async getRecordById(id: string): Promise<AuditRecord | null> {
    return this.auditRecords.find((r) => r.id === id) || null;
  }

  async getRecords(filters?: {
    workflowId?: string;
    dataSourceId?: string;
    decision?: string;
    isSimulation?: boolean;
    search?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: AuditRecord[]; total: number }> {
    let list = [...this.auditRecords];

    if (filters) {
      if (filters.workflowId) {
        list = list.filter((r) => r.workflowId === filters.workflowId);
      }
      if (filters.dataSourceId) {
        list = list.filter((r) => r.dataSourceId === filters.dataSourceId);
      }
      if (filters.decision) {
        list = list.filter((r) => r.decision === filters.decision);
      }
      if (typeof filters.isSimulation === 'boolean') {
        list = list.filter((r) => r.isSimulation === filters.isSimulation);
      }
      if (filters.search) {
        const query = filters.search.toLowerCase();
        list = list.filter(
          (r) =>
            r.id.toLowerCase().includes(query) ||
            r.workflowId.toLowerCase().includes(query) ||
            r.dataSourceId.toLowerCase().includes(query) ||
            r.rationale.toLowerCase().includes(query) ||
            r.action.toLowerCase().includes(query) ||
            r.purpose.toLowerCase().includes(query),
        );
      }
      if (filters.fromTimestamp) {
        list = list.filter((r) => new Date(r.timestamp) >= new Date(filters.fromTimestamp!));
      }
      if (filters.toTimestamp) {
        list = list.filter((r) => new Date(r.timestamp) <= new Date(filters.toTimestamp!));
      }
    }

    // Default order: latest records first for the viewer
    list.sort((a, b) => b.sequenceNumber - a.sequenceNumber);

    const total = list.length;
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;
    const paginated = list.slice(offset, offset + limit);

    return { records: paginated, total };
  }

  async verifyIntegrity(): Promise<AuditVerificationReport> {
    return HashChainUtil.verifyAuditChain(this.auditRecords);
  }
}
