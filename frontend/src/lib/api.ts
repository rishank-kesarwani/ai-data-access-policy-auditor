import axios from 'axios';
import {
  ApprovalRequest,
  AuditRecord,
  AuditVerificationReport,
  DataSource,
  Policy,
  PolicyEvaluationResult,
  SystemHealth,
  Workflow,
} from './types';

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api/v1';

export const apiClient = axios.create({
  baseURL: API_BASE,
  timeout: 12000,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('secops_token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }
  return config;
});

export const api = {
  // Health
  getHealth: async (): Promise<SystemHealth> => {
    // Health is exempt from apiPrefix, check /health
    const rootUrl = API_BASE.replace(/\/api\/v1\/?$/, '');
    const res = await axios.get(`${rootUrl}/health`);
    return res.data;
  },

  // Auth
  login: async (password: string, email?: string) => {
    const res = await apiClient.post('/auth/login', { password, email });
    return res.data;
  },

  getAuthStatus: async () => {
    const res = await apiClient.get('/auth/status');
    return res.data;
  },

  getProfile: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  // Inventory
  getWorkflows: async (): Promise<Workflow[]> => {
    const res = await apiClient.get('/inventory/workflows');
    return res.data;
  },

  createWorkflow: async (payload: Partial<Workflow>): Promise<Workflow> => {
    const res = await apiClient.post('/inventory/workflows', payload);
    return res.data;
  },

  getDataSources: async (): Promise<DataSource[]> => {
    const res = await apiClient.get('/inventory/data-sources');
    return res.data;
  },

  createDataSource: async (payload: Partial<DataSource>): Promise<DataSource> => {
    const res = await apiClient.post('/inventory/data-sources', payload);
    return res.data;
  },

  // Policies
  getPolicies: async (): Promise<Policy[]> => {
    const res = await apiClient.get('/policies');
    return res.data;
  },

  getActivePolicies: async (): Promise<Policy[]> => {
    const res = await apiClient.get('/policies/active');
    return res.data;
  },

  getPolicyById: async (id: string): Promise<Policy> => {
    const res = await apiClient.get(`/policies/${id}`);
    return res.data;
  },

  createPolicy: async (payload: any): Promise<Policy> => {
    const res = await apiClient.post('/policies', payload);
    return res.data;
  },

  createNewVersion: async (id: string, payload: any): Promise<Policy> => {
    const res = await apiClient.post(`/policies/${id}/version`, payload);
    return res.data;
  },

  updatePolicy: async (id: string, payload: any): Promise<Policy> => {
    const res = await apiClient.put(`/policies/${id}`, payload);
    return res.data;
  },

  submitForApproval: async (
    id: string,
    changesSummary: string,
  ): Promise<ApprovalRequest> => {
    const res = await apiClient.post(`/policies/${id}/submit-approval`, {
      changesSummary,
    });
    return res.data;
  },

  deletePolicy: async (id: string) => {
    const res = await apiClient.delete(`/policies/${id}`);
    return res.data;
  },

  // Approvals
  getApprovals: async (): Promise<ApprovalRequest[]> => {
    const res = await apiClient.get('/approvals');
    return res.data;
  },

  reviewApproval: async (
    id: string,
    decision: 'APPROVE' | 'REJECT',
    reviewNotes: string,
  ): Promise<ApprovalRequest> => {
    const res = await apiClient.post(`/approvals/${id}/review`, {
      decision,
      reviewNotes,
    });
    return res.data;
  },

  // Access Request Simulation & Evaluation
  evaluateAccessRequest: async (
    payload: any,
  ): Promise<PolicyEvaluationResult> => {
    const res = await apiClient.post('/access-request/evaluate', payload);
    return res.data;
  },

  simulateAccessRequest: async (
    payload: any,
  ): Promise<PolicyEvaluationResult> => {
    const res = await apiClient.post('/access-request/simulate', payload);
    return res.data;
  },

  getWalkthroughScenarios: async () => {
    const res = await apiClient.get('/access-request/scenarios');
    return res.data;
  },

  // Audit
  getAuditRecords: async (params?: {
    workflowId?: string;
    dataSourceId?: string;
    decision?: string;
    isSimulation?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  }): Promise<{ records: AuditRecord[]; total: number }> => {
    const res = await apiClient.get('/audit/records', { params });
    return res.data;
  },

  verifyChainIntegrity: async (): Promise<AuditVerificationReport> => {
    const res = await apiClient.get('/audit/verify-integrity');
    return res.data;
  },
};
