import * as crypto from 'crypto';
import { AuditRecord, AuditVerificationReport } from '../types';
import { GENESIS_HASH } from '../constants';

export class HashChainUtil {
  /**
   * Deterministically stringifies and computes SHA-256 hash of an access request payload.
   */
  static hashPayload(payload: any): string {
    const canonicalJson = JSON.stringify(payload, Object.keys(payload || {}).sort());
    return crypto.createHash('sha256').update(canonicalJson).digest('hex');
  }

  /**
   * Generates a tamper-evident record hash cryptographically bound to the previous record hash.
   */
  static calculateRecordHash(params: {
    previousRecordHash: string;
    id: string;
    sequenceNumber: number;
    timestamp: string;
    decision: string;
    isSimulation: boolean;
    requestHash: string;
    matchedPolicyId: string | null;
  }): string {
    const payloadToHash = [
      params.previousRecordHash || GENESIS_HASH,
      params.id,
      params.sequenceNumber.toString(),
      params.timestamp,
      params.decision,
      params.isSimulation ? 'true' : 'false',
      params.matchedPolicyId || 'NONE',
      params.requestHash,
    ].join(':');

    return crypto.createHash('sha256').update(payloadToHash).digest('hex');
  }

  /**
   * Validates the integrity of an ordered sequence of audit records.
   */
  static verifyAuditChain(records: AuditRecord[]): AuditVerificationReport {
    if (!records || records.length === 0) {
      return {
        totalRecords: 0,
        verifiedValidCount: 0,
        tamperedCount: 0,
        isChainIntact: true,
        invalidRecordIds: [],
        genesisHash: GENESIS_HASH,
        latestHash: GENESIS_HASH,
        verifiedAt: new Date().toISOString(),
      };
    }

    let expectedPrevHash = GENESIS_HASH;
    let tamperedCount = 0;
    const invalidRecordIds: string[] = [];

    // Ensure records are ordered by sequenceNumber ascending
    const sortedRecords = [...records].sort((a, b) => a.sequenceNumber - b.sequenceNumber);

    for (let i = 0; i < sortedRecords.length; i++) {
      const record = sortedRecords[i];

      // Check previous hash link
      if (record.previousRecordHash !== expectedPrevHash) {
        tamperedCount++;
        invalidRecordIds.push(record.id);
      }

      // Re-evaluate record hash
      const calculatedHash = this.calculateRecordHash({
        previousRecordHash: record.previousRecordHash,
        id: record.id,
        sequenceNumber: record.sequenceNumber,
        timestamp: record.timestamp,
        decision: record.decision,
        isSimulation: record.isSimulation,
        requestHash: record.requestHash,
        matchedPolicyId: record.matchedPolicyId,
      });

      if (calculatedHash !== record.recordHash) {
        if (!invalidRecordIds.includes(record.id)) {
          tamperedCount++;
          invalidRecordIds.push(record.id);
        }
      }

      expectedPrevHash = record.recordHash;
    }

    return {
      totalRecords: sortedRecords.length,
      verifiedValidCount: sortedRecords.length - tamperedCount,
      tamperedCount,
      isChainIntact: tamperedCount === 0,
      invalidRecordIds,
      genesisHash: GENESIS_HASH,
      latestHash: sortedRecords[sortedRecords.length - 1].recordHash,
      verifiedAt: new Date().toISOString(),
    };
  }
}
