import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
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
import {
  ApprovalDocument,
  AuditRecordDocument,
  DataSourceDocument,
  PolicyDocument,
  WorkflowDocument,
} from './schemas';

@Injectable()
export class MongoStorageService
  implements
    IInventoryRepository,
    IPolicyRepository,
    IApprovalRepository,
    IAuditRepository
{
  private readonly logger = new Logger(MongoStorageService.name);

  constructor(
    @InjectModel(WorkflowDocument.name)
    private readonly workflowModel: Model<WorkflowDocument>,
    @InjectModel(DataSourceDocument.name)
    private readonly dataSourceModel: Model<DataSourceDocument>,
    @InjectModel(PolicyDocument.name)
    private readonly policyModel: Model<PolicyDocument>,
    @InjectModel(ApprovalDocument.name)
    private readonly approvalModel: Model<ApprovalDocument>,
    @InjectModel(AuditRecordDocument.name)
    private readonly auditRecordModel: Model<AuditRecordDocument>,
  ) {}

  // Workflows
  async getWorkflows(): Promise<Workflow[]> {
    const docs = await this.workflowModel.find().lean();
    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      owner: d.owner,
      businessUnit: d.businessUnit,
      riskTier: d.riskTier,
      modelFamily: d.modelFamily,
      active: d.active,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async getWorkflowById(id: string): Promise<Workflow | null> {
    const d: any = await this.workflowModel.findOne({ id }).lean();
    if (!d) return null;
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      owner: d.owner,
      businessUnit: d.businessUnit,
      riskTier: d.riskTier,
      modelFamily: d.modelFamily,
      active: d.active,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async createWorkflow(workflow: Workflow): Promise<Workflow> {
    await this.workflowModel.create(workflow);
    return workflow;
  }

  async updateWorkflow(id: string, update: Partial<Workflow>): Promise<Workflow | null> {
    const d: any = await this.workflowModel
      .findOneAndUpdate({ id }, { $set: update }, { new: true })
      .lean();
    if (!d) return null;
    return this.getWorkflowById(id);
  }

  // DataSources
  async getDataSources(): Promise<DataSource[]> {
    const docs = await this.dataSourceModel.find().lean();
    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      owner: d.owner,
      sensitivity: d.sensitivity,
      residencyRegion: d.residencyRegion,
      retentionDaysLimit: d.retentionDaysLimit,
      containsPii: d.containsPii,
      tags: d.tags || [],
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async getDataSourceById(id: string): Promise<DataSource | null> {
    const d: any = await this.dataSourceModel.findOne({ id }).lean();
    if (!d) return null;
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      owner: d.owner,
      sensitivity: d.sensitivity,
      residencyRegion: d.residencyRegion,
      retentionDaysLimit: d.retentionDaysLimit,
      containsPii: d.containsPii,
      tags: d.tags || [],
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async createDataSource(dataSource: DataSource): Promise<DataSource> {
    await this.dataSourceModel.create(dataSource);
    return dataSource;
  }

  async updateDataSource(id: string, update: Partial<DataSource>): Promise<DataSource | null> {
    const d: any = await this.dataSourceModel
      .findOneAndUpdate({ id }, { $set: update }, { new: true })
      .lean();
    if (!d) return null;
    return this.getDataSourceById(id);
  }

  // Policies
  async getAllPolicies(): Promise<Policy[]> {
    const docs = await this.policyModel.find().lean();
    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      version: d.version,
      status: d.status,
      rules: d.rules || [],
      createdBy: d.createdBy,
      approvedBy: d.approvedBy,
      approvalNotes: d.approvalNotes,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async getActivePolicies(): Promise<Policy[]> {
    const docs = await this.policyModel.find({ status: 'ACTIVE' }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      version: d.version,
      status: d.status,
      rules: d.rules || [],
      createdBy: d.createdBy,
      approvedBy: d.approvedBy,
      approvalNotes: d.approvalNotes,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async getPolicyById(id: string): Promise<Policy | null> {
    const d: any = await this.policyModel.findOne({ id }).lean();
    if (!d) return null;
    return {
      id: d.id,
      name: d.name,
      description: d.description,
      version: d.version,
      status: d.status,
      rules: d.rules || [],
      createdBy: d.createdBy,
      approvedBy: d.approvedBy,
      approvalNotes: d.approvalNotes,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    };
  }

  async getPolicyVersions(id: string): Promise<Policy[]> {
    const base = await this.getPolicyById(id);
    if (!base) return [];
    const docs = await this.policyModel.find({ name: base.name }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      name: d.name,
      description: d.description,
      version: d.version,
      status: d.status,
      rules: d.rules || [],
      createdBy: d.createdBy,
      approvedBy: d.approvedBy,
      approvalNotes: d.approvalNotes,
      createdAt: d.createdAt?.toISOString?.() || new Date().toISOString(),
      updatedAt: d.updatedAt?.toISOString?.() || new Date().toISOString(),
    }));
  }

  async createPolicy(policy: Policy): Promise<Policy> {
    await this.policyModel.create(policy);
    return policy;
  }

  async updatePolicy(id: string, update: Partial<Policy>): Promise<Policy | null> {
    await this.policyModel.findOneAndUpdate({ id }, { $set: update }, { new: true }).lean();
    return this.getPolicyById(id);
  }

  async deletePolicy(id: string): Promise<boolean> {
    const res = await this.policyModel.deleteOne({ id });
    return (res.deletedCount || 0) > 0;
  }

  // Approvals
  async getAllApprovals(): Promise<ApprovalRequest[]> {
    const docs = await this.approvalModel.find().sort({ submittedAt: -1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      policyId: d.policyId,
      policyName: d.policyName,
      policyVersion: d.policyVersion,
      submittedBy: d.submittedBy,
      submittedAt: d.submittedAt,
      status: d.status,
      reviewedBy: d.reviewedBy,
      reviewedAt: d.reviewedAt,
      reviewNotes: d.reviewNotes,
      changesSummary: d.changesSummary,
    }));
  }

  async getPendingApprovals(): Promise<ApprovalRequest[]> {
    const docs = await this.approvalModel.find({ status: 'PENDING' }).sort({ submittedAt: -1 }).lean();
    return docs.map((d: any) => ({
      id: d.id,
      policyId: d.policyId,
      policyName: d.policyName,
      policyVersion: d.policyVersion,
      submittedBy: d.submittedBy,
      submittedAt: d.submittedAt,
      status: d.status,
      reviewedBy: d.reviewedBy,
      reviewedAt: d.reviewedAt,
      reviewNotes: d.reviewNotes,
      changesSummary: d.changesSummary,
    }));
  }

  async getApprovalById(id: string): Promise<ApprovalRequest | null> {
    const d: any = await this.approvalModel.findOne({ id }).lean();
    if (!d) return null;
    return {
      id: d.id,
      policyId: d.policyId,
      policyName: d.policyName,
      policyVersion: d.policyVersion,
      submittedBy: d.submittedBy,
      submittedAt: d.submittedAt,
      status: d.status,
      reviewedBy: d.reviewedBy,
      reviewedAt: d.reviewedAt,
      reviewNotes: d.reviewNotes,
      changesSummary: d.changesSummary,
    };
  }

  async createApproval(approval: ApprovalRequest): Promise<ApprovalRequest> {
    await this.approvalModel.create(approval);
    return approval;
  }

  async updateApproval(id: string, update: Partial<ApprovalRequest>): Promise<ApprovalRequest | null> {
    await this.approvalModel.findOneAndUpdate({ id }, { $set: update }, { new: true }).lean();
    return this.getApprovalById(id);
  }

  // Audit Records
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

    await this.auditRecordModel.create(completeRecord);
    return completeRecord;
  }

  async getLatestRecord(): Promise<AuditRecord | null> {
    const d: any = await this.auditRecordModel.findOne().sort({ sequenceNumber: -1 }).lean();
    if (!d) return null;
    return {
      id: d.id,
      sequenceNumber: d.sequenceNumber,
      timestamp: d.timestamp,
      requestId: d.requestId,
      workflowId: d.workflowId,
      dataSourceId: d.dataSourceId,
      action: d.action,
      purpose: d.purpose,
      decision: d.decision,
      matchedPolicyId: d.matchedPolicyId,
      matchedPolicyVersion: d.matchedPolicyVersion,
      matchedRuleId: d.matchedRuleId,
      rationale: d.rationale,
      isSimulation: d.isSimulation,
      actor: d.actor,
      principal: d.principal || {},
      contextRedacted: d.contextRedacted || {},
      conditionsEvaluated: d.conditionsEvaluated || [],
      missingRequirements: d.missingRequirements || [],
      requestHash: d.requestHash,
      previousRecordHash: d.previousRecordHash,
      recordHash: d.recordHash,
    };
  }

  async getRecordById(id: string): Promise<AuditRecord | null> {
    const d: any = await this.auditRecordModel.findOne({ id }).lean();
    if (!d) return null;
    return {
      id: d.id,
      sequenceNumber: d.sequenceNumber,
      timestamp: d.timestamp,
      requestId: d.requestId,
      workflowId: d.workflowId,
      dataSourceId: d.dataSourceId,
      action: d.action,
      purpose: d.purpose,
      decision: d.decision,
      matchedPolicyId: d.matchedPolicyId,
      matchedPolicyVersion: d.matchedPolicyVersion,
      matchedRuleId: d.matchedRuleId,
      rationale: d.rationale,
      isSimulation: d.isSimulation,
      actor: d.actor,
      principal: d.principal || {},
      contextRedacted: d.contextRedacted || {},
      conditionsEvaluated: d.conditionsEvaluated || [],
      missingRequirements: d.missingRequirements || [],
      requestHash: d.requestHash,
      previousRecordHash: d.previousRecordHash,
      recordHash: d.recordHash,
    };
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
    const query: any = {};
    if (filters?.workflowId) query.workflowId = filters.workflowId;
    if (filters?.dataSourceId) query.dataSourceId = filters.dataSourceId;
    if (filters?.decision) query.decision = filters.decision;
    if (typeof filters?.isSimulation === 'boolean') query.isSimulation = filters.isSimulation;
    if (filters?.fromTimestamp || filters?.toTimestamp) {
      query.timestamp = {};
      if (filters.fromTimestamp) query.timestamp.$gte = filters.fromTimestamp;
      if (filters.toTimestamp) query.timestamp.$lte = filters.toTimestamp;
    }
    if (filters?.search) {
      const regex = new RegExp(filters.search, 'i');
      query.$or = [
        { id: regex },
        { workflowId: regex },
        { dataSourceId: regex },
        { rationale: regex },
        { action: regex },
        { purpose: regex },
      ];
    }

    const total = await this.auditRecordModel.countDocuments(query);
    const offset = filters?.offset || 0;
    const limit = filters?.limit || 50;

    const docs = await this.auditRecordModel
      .find(query)
      .sort({ sequenceNumber: -1 })
      .skip(offset)
      .limit(limit)
      .lean();

    const records: AuditRecord[] = docs.map((d: any) => ({
      id: d.id,
      sequenceNumber: d.sequenceNumber,
      timestamp: d.timestamp,
      requestId: d.requestId,
      workflowId: d.workflowId,
      dataSourceId: d.dataSourceId,
      action: d.action,
      purpose: d.purpose,
      decision: d.decision,
      matchedPolicyId: d.matchedPolicyId,
      matchedPolicyVersion: d.matchedPolicyVersion,
      matchedRuleId: d.matchedRuleId,
      rationale: d.rationale,
      isSimulation: d.isSimulation,
      actor: d.actor,
      principal: d.principal || {},
      contextRedacted: d.contextRedacted || {},
      conditionsEvaluated: d.conditionsEvaluated || [],
      missingRequirements: d.missingRequirements || [],
      requestHash: d.requestHash,
      previousRecordHash: d.previousRecordHash,
      recordHash: d.recordHash,
    }));

    return { records, total };
  }

  async verifyIntegrity(): Promise<AuditVerificationReport> {
    const docs = await this.auditRecordModel.find().sort({ sequenceNumber: 1 }).lean();
    const records: AuditRecord[] = docs.map((d: any) => ({
      id: d.id,
      sequenceNumber: d.sequenceNumber,
      timestamp: d.timestamp,
      requestId: d.requestId,
      workflowId: d.workflowId,
      dataSourceId: d.dataSourceId,
      action: d.action,
      purpose: d.purpose,
      decision: d.decision,
      matchedPolicyId: d.matchedPolicyId,
      matchedPolicyVersion: d.matchedPolicyVersion,
      matchedRuleId: d.matchedRuleId,
      rationale: d.rationale,
      isSimulation: d.isSimulation,
      actor: d.actor,
      principal: d.principal || {},
      contextRedacted: d.contextRedacted || {},
      conditionsEvaluated: d.conditionsEvaluated || [],
      missingRequirements: d.missingRequirements || [],
      requestHash: d.requestHash,
      previousRecordHash: d.previousRecordHash,
      recordHash: d.recordHash,
    }));
    return HashChainUtil.verifyAuditChain(records);
  }
}
