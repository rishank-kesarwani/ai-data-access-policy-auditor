import { HashChainUtil } from './hash-chain';
import { AuditRecord } from '../types';
import { GENESIS_HASH } from '../constants';

describe('HashChainUtil', () => {
  it('should calculate deterministic SHA-256 hash of payloads regardless of key ordering', () => {
    const payload1 = { a: 1, b: 'test', c: true };
    const payload2 = { c: true, a: 1, b: 'test' };

    const hash1 = HashChainUtil.hashPayload(payload1);
    const hash2 = HashChainUtil.hashPayload(payload2);

    expect(hash1).toBe(hash2);
    expect(hash1).toHaveLength(64); // SHA-256 hex string length
  });

  it('should successfully verify an intact, valid cryptographic audit chain', () => {
    const record1Hash = HashChainUtil.calculateRecordHash({
      previousRecordHash: GENESIS_HASH,
      id: 'aud-001',
      sequenceNumber: 1,
      timestamp: '2026-10-25T00:00:00.000Z',
      decision: 'ALLOW',
      isSimulation: true,
      requestHash: 'hash-req-1',
      matchedPolicyId: 'pol-1',
    });

    const record1: AuditRecord = {
      id: 'aud-001',
      sequenceNumber: 1,
      timestamp: '2026-10-25T00:00:00.000Z',
      requestId: 'req-1',
      workflowId: 'wf-1',
      dataSourceId: 'ds-1',
      action: 'READ',
      purpose: 'CUSTOMER_SUPPORT',
      decision: 'ALLOW',
      matchedPolicyId: 'pol-1',
      matchedPolicyVersion: 1,
      matchedRuleId: 'r-1',
      rationale: 'OK',
      isSimulation: true,
      actor: 'operator@company.internal',
      principal: {},
      contextRedacted: {},
      conditionsEvaluated: [],
      missingRequirements: [],
      requestHash: 'hash-req-1',
      previousRecordHash: GENESIS_HASH,
      recordHash: record1Hash,
    };

    const record2Hash = HashChainUtil.calculateRecordHash({
      previousRecordHash: record1Hash,
      id: 'aud-002',
      sequenceNumber: 2,
      timestamp: '2026-10-25T00:01:00.000Z',
      decision: 'DENY',
      isSimulation: false,
      requestHash: 'hash-req-2',
      matchedPolicyId: null,
    });

    const record2: AuditRecord = {
      id: 'aud-002',
      sequenceNumber: 2,
      timestamp: '2026-10-25T00:01:00.000Z',
      requestId: 'req-2',
      workflowId: 'wf-2',
      dataSourceId: 'ds-2',
      action: 'TRAIN',
      purpose: 'MODEL_TRAINING',
      decision: 'DENY',
      matchedPolicyId: null,
      matchedPolicyVersion: null,
      matchedRuleId: null,
      rationale: 'Denied',
      isSimulation: false,
      actor: 'operator@company.internal',
      principal: {},
      contextRedacted: {},
      conditionsEvaluated: [],
      missingRequirements: [],
      requestHash: 'hash-req-2',
      previousRecordHash: record1Hash,
      recordHash: record2Hash,
    };

    const report = HashChainUtil.verifyAuditChain([record1, record2]);

    expect(report.isChainIntact).toBe(true);
    expect(report.totalRecords).toBe(2);
    expect(report.verifiedValidCount).toBe(2);
    expect(report.tamperedCount).toBe(0);
    expect(report.invalidRecordIds).toHaveLength(0);
  });

  it('should detect tampering if a previous record hash or record content is altered', () => {
    const record1Hash = HashChainUtil.calculateRecordHash({
      previousRecordHash: GENESIS_HASH,
      id: 'aud-001',
      sequenceNumber: 1,
      timestamp: '2026-10-25T00:00:00.000Z',
      decision: 'ALLOW',
      isSimulation: true,
      requestHash: 'hash-req-1',
      matchedPolicyId: 'pol-1',
    });

    const record1: AuditRecord = {
      id: 'aud-001',
      sequenceNumber: 1,
      timestamp: '2026-10-25T00:00:00.000Z',
      requestId: 'req-1',
      workflowId: 'wf-1',
      dataSourceId: 'ds-1',
      action: 'READ',
      purpose: 'CUSTOMER_SUPPORT',
      decision: 'ALLOW',
      matchedPolicyId: 'pol-1',
      matchedPolicyVersion: 1,
      matchedRuleId: 'r-1',
      rationale: 'OK',
      isSimulation: true,
      actor: 'operator@company.internal',
      principal: {},
      contextRedacted: {},
      conditionsEvaluated: [],
      missingRequirements: [],
      requestHash: 'hash-req-1',
      previousRecordHash: GENESIS_HASH,
      recordHash: record1Hash,
    };

    // Tampered record: previous hash does not link to record1Hash
    const tamperedRecord2: AuditRecord = {
      id: 'aud-002',
      sequenceNumber: 2,
      timestamp: '2026-10-25T00:01:00.000Z',
      requestId: 'req-2',
      workflowId: 'wf-2',
      dataSourceId: 'ds-2',
      action: 'TRAIN',
      purpose: 'MODEL_TRAINING',
      decision: 'DENY',
      matchedPolicyId: null,
      matchedPolicyVersion: null,
      matchedRuleId: null,
      rationale: 'Denied',
      isSimulation: false,
      actor: 'operator@company.internal',
      principal: {},
      contextRedacted: {},
      conditionsEvaluated: [],
      missingRequirements: [],
      requestHash: 'hash-req-2',
      previousRecordHash: 'maliciously-altered-hash-value',
      recordHash: 'fake-hash',
    };

    const report = HashChainUtil.verifyAuditChain([record1, tamperedRecord2]);

    expect(report.isChainIntact).toBe(false);
    expect(report.tamperedCount).toBe(1);
    expect(report.invalidRecordIds).toContain('aud-002');
  });
});
