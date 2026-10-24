'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { AuditRecord, AuditVerificationReport } from '@/lib/types';
import {
  History,
  ShieldCheck,
  Search,
  Filter,
  CheckCircle2,
  AlertTriangle,
  Lock,
  LogIn,
  KeyRound,
  FileCheck2,
  RefreshCw,
} from 'lucide-react';
import Link from 'next/link';

export default function AuditPage() {
  const { isAuthenticated } = useAuth();
  const [records, setRecords] = useState<AuditRecord[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [decisionFilter, setDecisionFilter] = useState('');
  const [simulationFilter, setSimulationFilter] = useState<string>('ALL');

  // Verification modal state
  const [isVerifying, setIsVerifying] = useState(false);
  const [verificationReport, setVerificationReport] = useState<AuditVerificationReport | null>(null);

  const fetchRecords = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const isSim =
        simulationFilter === 'SIMULATION'
          ? true
          : simulationFilter === 'REAL'
          ? false
          : undefined;

      const data = await api.getAuditRecords({
        search: searchQuery || undefined,
        decision: decisionFilter || undefined,
        isSimulation: isSim,
        limit: 50,
      });

      setRecords(data.records);
      setTotal(data.total);
    } catch (e) {
      console.error('Failed to load audit records', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated, decisionFilter, simulationFilter]);

  const handleRunVerification = async () => {
    setIsVerifying(true);
    try {
      const report = await api.verifyChainIntegrity();
      setVerificationReport(report);
    } catch (e) {
      console.error('Verification failed', e);
    } finally {
      setIsVerifying(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container fade-in" style={{ maxWidth: '640px', textAlign: 'center', padding: '60px 16px' }}>
        <div className="card" style={{ padding: '48px 32px', backgroundColor: 'var(--bg-surface)' }}>
          <Lock size={48} color="#6366f1" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Protected Audit Records
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Enterprise access records contain sensitive timestamps, workflow identities, and
            compliance context. Access to the immutable audit trail and hash verifier strictly
            requires authentication.
          </p>
          <Link href="/login" className="btn btn-primary" id="btn-audit-signin">
            <LogIn size={16} />
            Sign In to Inspect Audit Trail
          </Link>
        </div>
      </div>
    );
  }

  const getDecisionBadge = (decision: string) => {
    if (decision === 'ALLOW') return <span className="badge badge-allow">ALLOW</span>;
    if (decision === 'DENY') return <span className="badge badge-deny">DENY</span>;
    return <span className="badge badge-escalate">ESCALATE</span>;
  };

  return (
    <div className="container fade-in">
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
          flexWrap: 'wrap',
          gap: '16px',
          marginBottom: '28px',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Immutable Audit Trail & Cryptographic Verifier
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Append-only decision records bound by SHA-256 hash chaining. Validates that prior
            authorization events cannot be secretly modified or deleted.
          </p>
        </div>

        <button
          onClick={handleRunVerification}
          disabled={isVerifying}
          className="btn btn-primary"
          id="btn-verify-audit-chain"
        >
          <ShieldCheck size={18} />
          {isVerifying ? 'Verifying Hashes...' : 'Verify Chain Integrity'}
        </button>
      </div>

      {/* Persistence Architecture Guarantee Card */}
      <div
        style={{
          padding: '16px 20px',
          backgroundColor: 'var(--bg-surface)',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '24px',
          display: 'flex',
          alignItems: 'center',
          gap: '14px',
        }}
      >
        <KeyRound size={24} color="#38bdf8" />
        <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong style={{ color: '#ffffff' }}>Persistence Guarantee:</strong> Audit events are
          persisted in an append-only store with forward SHA-256 cryptographic chaining:{' '}
          <code className="code-pill">
            recordHash = sha256(prevHash:id:seq:timestamp:decision:isSimulation:matchedPolicy:requestHash)
          </code>
          . Stored in MongoDB (with automatic in-memory fallback for testing). Never dependent on
          ephemeral local files.
        </div>
      </div>

      {/* Filters Bar */}
      <div className="card" style={{ marginBottom: '24px', padding: '18px 20px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', alignItems: 'center' }}>
          <div style={{ flex: 1, minWidth: '220px' }}>
            <div style={{ position: 'relative' }}>
              <input
                type="text"
                placeholder="Search by ID, workflow, data source, rationale..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchRecords()}
                className="form-input"
                id="input-audit-search"
                style={{ paddingLeft: '36px' }}
              />
              <Search
                size={16}
                color="#64748b"
                style={{ position: 'absolute', left: '12px', top: '12px' }}
              />
            </div>
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={decisionFilter}
              onChange={(e) => setDecisionFilter(e.target.value)}
              className="form-select"
              id="select-audit-decision"
            >
              <option value="">All Decisions</option>
              <option value="ALLOW">ALLOW only</option>
              <option value="DENY">DENY only</option>
              <option value="ESCALATE">ESCALATE only</option>
            </select>
          </div>

          <div style={{ width: '160px' }}>
            <select
              value={simulationFilter}
              onChange={(e) => setSimulationFilter(e.target.value)}
              className="form-select"
              id="select-audit-type"
            >
              <option value="ALL">All Types</option>
              <option value="REAL">Real Requests</option>
              <option value="SIMULATION">Simulations</option>
            </select>
          </div>

          <button onClick={fetchRecords} className="btn btn-secondary" id="btn-apply-filters">
            <RefreshCw size={14} />
            Filter
          </button>
        </div>
      </div>

      {/* Records Table */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <History size={18} color="#818cf8" />
            Decision Records ({total})
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Seq #</th>
                <th>Timestamp</th>
                <th>Outcome</th>
                <th>Type</th>
                <th>Workflow Principal</th>
                <th>Target Data Source</th>
                <th>Action / Purpose</th>
                <th>Cryptographic Hashes</th>
              </tr>
            </thead>
            <tbody>
              {records.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
                    No audit records match the selected filters.
                  </td>
                </tr>
              ) : (
                records.map((r) => (
                  <tr key={r.id}>
                    <td>
                      <span className="code-pill">#{r.sequenceNumber}</span>
                    </td>
                    <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>
                      {new Date(r.timestamp).toLocaleString()}
                    </td>
                    <td>{getDecisionBadge(r.decision)}</td>
                    <td>
                      {r.isSimulation ? (
                        <span className="badge badge-simulation" style={{ fontSize: '0.7rem' }}>
                          Simulation
                        </span>
                      ) : (
                        <span className="badge badge-active" style={{ fontSize: '0.7rem' }}>
                          Real Access
                        </span>
                      )}
                    </td>
                    <td>
                      <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>{r.workflowId}</strong>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{r.dataSourceId}</td>
                    <td>
                      <div style={{ fontSize: '0.84rem', color: '#ffffff' }}>{r.action}</div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{r.purpose}</div>
                    </td>
                    <td style={{ maxWidth: '240px' }}>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                        Hash: <span className="code-pill">{r.recordHash.substring(0, 14)}...</span>
                      </div>
                      <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', marginTop: '2px' }}>
                        Prev: <span className="code-pill">{r.previousRecordHash.substring(0, 14)}...</span>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Chain Verification Result Modal */}
      {verificationReport && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.75)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 100,
            padding: '16px',
          }}
        >
          <div
            className="card fade-in"
            style={{ width: '100%', maxWidth: '580px', backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="card-header">
              <div className="card-title">
                <ShieldCheck size={20} color="var(--allow-green)" />
                Cryptographic Chain Verification Report
              </div>
            </div>

            <div
              style={{
                padding: '16px',
                backgroundColor: verificationReport.isChainIntact
                  ? 'rgba(16, 185, 129, 0.1)'
                  : 'rgba(244, 63, 94, 0.1)',
                border: `1px solid ${
                  verificationReport.isChainIntact ? 'var(--allow-green)' : 'var(--deny-red)'
                }`,
                borderRadius: 'var(--radius-md)',
                marginBottom: '20px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
              }}
            >
              {verificationReport.isChainIntact ? (
                <CheckCircle2 size={24} color="var(--allow-green)" />
              ) : (
                <AlertTriangle size={24} color="var(--deny-red)" />
              )}
              <div>
                <div style={{ fontWeight: 700, fontSize: '1rem', color: '#ffffff' }}>
                  {verificationReport.isChainIntact
                    ? 'Audit Trail Integrity Verified: Chain Untampered'
                    : 'Integrity Failure: Tampered Records Detected!'}
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                  All records from genesis block up to the latest entry have been cryptographically re-evaluated.
                </div>
              </div>
            </div>

            <div className="grid-2" style={{ gap: '14px', marginBottom: '18px' }}>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total Records Evaluated</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                  {verificationReport.totalRecords}
                </div>
              </div>
              <div style={{ padding: '12px', backgroundColor: 'var(--bg-canvas)', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Cryptographically Valid</div>
                <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--allow-green)' }}>
                  {verificationReport.verifiedValidCount}
                </div>
              </div>
            </div>

            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: '10px' }}>
              <div>
                Genesis Hash: <code className="code-pill">{verificationReport.genesisHash}</code>
              </div>
              <div style={{ marginTop: '6px' }}>
                Latest Hash: <code className="code-pill">{verificationReport.latestHash}</code>
              </div>
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '24px' }}>
              <button
                onClick={() => setVerificationReport(null)}
                className="btn btn-secondary"
                id="btn-close-verification"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
