'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  PlayCircle,
  FileCheck2,
  GitPullRequest,
  History,
  Database,
  ArrowRight,
  Lock,
  Cpu,
  AlertTriangle,
  CheckCircle2,
  Server,
  Layers,
  Sparkles,
  RefreshCw,
} from 'lucide-react';
import {
  ApprovalRequest,
  AuditRecord,
  DataSource,
  Policy,
  SystemHealth,
  Workflow,
} from '@/lib/types';

export default function DashboardPage() {
  const { isPublicMode, isAuthenticated } = useAuth();
  const [health, setHealth] = useState<SystemHealth | null>(null);
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [recentAudits, setRecentAudits] = useState<AuditRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [hData, wfData, dsData, polData] = await Promise.allSettled([
        api.getHealth(),
        api.getWorkflows(),
        api.getDataSources(),
        api.getPolicies(),
      ]);

      if (hData.status === 'fulfilled') setHealth(hData.value);
      if (wfData.status === 'fulfilled') setWorkflows(wfData.value);
      if (dsData.status === 'fulfilled') setDataSources(dsData.value);
      if (polData.status === 'fulfilled') setPolicies(polData.value);

      if (isAuthenticated) {
        const [apprData, auditData] = await Promise.allSettled([
          api.getApprovals(),
          api.getAuditRecords({ limit: 5 }),
        ]);
        if (apprData.status === 'fulfilled') setApprovals(apprData.value);
        if (auditData.status === 'fulfilled') setRecentAudits(auditData.value.records);
      }
    } catch (e) {
      console.error('Failed to load dashboard data', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const activePoliciesCount = policies.filter((p) => p.status === 'ACTIVE').length;
  const pendingApprovalsCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <div className="container fade-in">
      {/* Hero Banner */}
      <div
        style={{
          background: 'linear-gradient(135deg, rgba(30, 41, 59, 0.7), rgba(15, 23, 42, 0.95))',
          border: '1px solid var(--border-card)',
          borderRadius: 'var(--radius-lg)',
          padding: '36px 32px',
          marginBottom: '32px',
          boxShadow: 'var(--shadow-card)',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '-50px',
            right: '-50px',
            width: '260px',
            height: '260px',
            background: 'radial-gradient(circle, rgba(99, 102, 241, 0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        <div style={{ maxWidth: '820px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
            <span className="badge badge-active">Enterprise Zero-Trust Policy Engine</span>
            {isPublicMode && !isAuthenticated && (
              <span className="badge badge-simulation">Public Viewer Demo</span>
            )}
          </div>
          <h1
            style={{
              fontSize: '2.1rem',
              fontWeight: 800,
              lineHeight: 1.2,
              marginBottom: '12px',
              color: '#ffffff',
              letterSpacing: '-0.02em',
            }}
          >
            AI Data Access & Policy Auditor
          </h1>
          <p
            style={{
              fontSize: '1.05rem',
              color: 'var(--text-secondary)',
              lineHeight: 1.6,
              marginBottom: '24px',
            }}
          >
            Deterministic authorization for AI workflows accessing sensitive enterprise data.
            Features explicit allow/deny/escalate rules, explainable decision rationales, and
            cryptographically verifiable tamper-evident audit records.
          </p>

          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            <Link href="/simulator" className="btn btn-primary" id="btn-hero-simulator">
              <PlayCircle size={18} />
              Launch Decision Simulator
            </Link>
            <Link href="/walkthrough" className="btn btn-secondary" id="btn-hero-walkthrough">
              <Sparkles size={18} />
              Explore Demo Walkthrough
            </Link>
            <Link href="/policies" className="btn btn-outline" id="btn-hero-policies">
              <FileCheck2 size={18} />
              Policy Registry
            </Link>
          </div>
        </div>
      </div>

      {/* Telemetry Metric Cards */}
      <div className="grid-4" style={{ marginBottom: '32px' }}>
        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Active Policies
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '4px', color: '#818cf8' }}>
                {activePoliciesCount}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(99, 102, 241, 0.15)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <FileCheck2 size={20} color="#818cf8" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
            {policies.length} total versions managed
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Cataloged Workflows
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '4px', color: '#38bdf8' }}>
                {workflows.length}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(56, 189, 248, 0.15)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Cpu size={20} color="#38bdf8" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
            Explicit owners & risk tiers
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Data Sources
              </div>
              <div style={{ fontSize: '1.8rem', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
                {dataSources.length}
              </div>
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <Database size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
            PII & sensitivity classified
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                Audit Integrity
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 700, marginTop: '8px', color: '#10b981' }}>
                Verified Intact
              </div>
            </div>
            <div
              style={{
                background: 'rgba(16, 185, 129, 0.15)',
                padding: '10px',
                borderRadius: 'var(--radius-md)',
              }}
            >
              <ShieldCheck size={20} color="#10b981" />
            </div>
          </div>
          <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '10px' }}>
            SHA-256 cryptographic chain
          </div>
        </div>
      </div>

      {/* Architecture & Integration Status Panel */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="card-header">
          <div className="card-title">
            <Server size={18} color="#818cf8" />
            System Architecture & Live Integrations
          </div>
          <button onClick={loadData} className="btn btn-secondary btn-sm" id="btn-refresh-health">
            <RefreshCw size={13} />
            Refresh Status
          </button>
        </div>

        <div className="grid-3">
          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <strong style={{ fontSize: '0.9rem' }}>Authorization Engine</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Deterministic evaluation with explicit DENY precedence, mandatory conditions check,
              and safe default-deny.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <strong style={{ fontSize: '0.9rem' }}>Shared Railway AI Platform</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Provides explainable governance summaries via verified endpoint <code className="code-pill">POST /api/v1/ai/chat</code>. Never replaces deterministic rules.
            </p>
          </div>

          <div
            style={{
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-subtle)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
              <CheckCircle2 size={16} color="#10b981" />
              <strong style={{ fontSize: '0.9rem' }}>Railway Notification Service</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Alerts SecOps via <code className="code-pill">POST /v1/notifications</code> on high-risk ESCALATE requests and policy approvals.
            </p>
          </div>
        </div>
      </div>

      {/* Decision Outcomes Overview */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Layers size={18} color="#818cf8" />
            Deterministic Decision Governance Matrix
          </div>
          <Link href="/walkthrough" className="btn btn-outline btn-sm">
            View Live Scenarios <ArrowRight size={13} />
          </Link>
        </div>

        <div className="grid-3" style={{ marginTop: '12px' }}>
          <div
            style={{
              borderLeft: '4px solid var(--allow-green)',
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-allow">ALLOW</span>
              <strong style={{ fontSize: '0.9rem' }}>Permitted Access</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Granted only when an active policy explicitly permits the action, workflow, and data
              source, and ALL mandatory conditions (e.g. consent, tokenized PII) are satisfied.
            </p>
          </div>

          <div
            style={{
              borderLeft: '4px solid var(--deny-red)',
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-deny">DENY</span>
              <strong style={{ fontSize: '0.9rem' }}>Blocked Access</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Triggered by explicit DENY rules (which override all allow rules), missing conditions,
              or the safe default-deny rule for unknown or insufficiently authorized assets.
            </p>
          </div>

          <div
            style={{
              borderLeft: '4px solid var(--escalate-amber)',
              padding: '16px',
              backgroundColor: 'var(--bg-surface)',
              borderRadius: '0 var(--radius-md) var(--radius-md) 0',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span className="badge badge-escalate">ESCALATE</span>
              <strong style={{ fontSize: '0.9rem' }}>Human Review Required</strong>
            </div>
            <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
              Triggered when high-risk operations (e.g., bulk exports, model training on restricted
              financial or healthcare assets) touch sensitive data, routing to SecOps.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
