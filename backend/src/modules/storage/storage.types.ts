import {
  AuditRecord,
  DataSource,
  Policy,
  Workflow,
  ApprovalRequest,
  AuditVerificationReport,
} from '../../common/types';

export interface IInventoryRepository {
  getWorkflows(): Promise<Workflow[]>;
  getWorkflowById(id: string): Promise<Workflow | null>;
  createWorkflow(workflow: Workflow): Promise<Workflow>;
  updateWorkflow(id: string, workflow: Partial<Workflow>): Promise<Workflow | null>;

  getDataSources(): Promise<DataSource[]>;
  getDataSourceById(id: string): Promise<DataSource | null>;
  createDataSource(dataSource: DataSource): Promise<DataSource>;
  updateDataSource(id: string, dataSource: Partial<DataSource>): Promise<DataSource | null>;
}

export interface IPolicyRepository {
  getAllPolicies(): Promise<Policy[]>;
  getActivePolicies(): Promise<Policy[]>;
  getPolicyById(id: string): Promise<Policy | null>;
  getPolicyVersions(id: string): Promise<Policy[]>;
  createPolicy(policy: Policy): Promise<Policy>;
  updatePolicy(id: string, policy: Partial<Policy>): Promise<Policy | null>;
  deletePolicy(id: string): Promise<boolean>;
}

export interface IApprovalRepository {
  getAllApprovals(): Promise<ApprovalRequest[]>;
  getPendingApprovals(): Promise<ApprovalRequest[]>;
  getApprovalById(id: string): Promise<ApprovalRequest | null>;
  createApproval(approval: ApprovalRequest): Promise<ApprovalRequest>;
  updateApproval(id: string, update: Partial<ApprovalRequest>): Promise<ApprovalRequest | null>;
}

export interface IAuditRepository {
  appendRecord(record: Omit<AuditRecord, 'sequenceNumber' | 'previousRecordHash' | 'recordHash'>): Promise<AuditRecord>;
  getRecords(filters?: {
    workflowId?: string;
    dataSourceId?: string;
    decision?: string;
    isSimulation?: boolean;
    search?: string;
    fromTimestamp?: string;
    toTimestamp?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: AuditRecord[]; total: number }>;
  getRecordById(id: string): Promise<AuditRecord | null>;
  getLatestRecord(): Promise<AuditRecord | null>;
  verifyIntegrity(): Promise<AuditVerificationReport>;
}
