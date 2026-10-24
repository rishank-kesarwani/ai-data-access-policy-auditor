'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { DataSource, Workflow } from '@/lib/types';
import {
  Database,
  Cpu,
  Shield,
  Layers,
  Globe,
  Clock,
  User,
  Plus,
  CheckCircle2,
  XCircle,
} from 'lucide-react';

export default function InventoryPage() {
  const [activeTab, setActiveTab] = useState<'WORKFLOWS' | 'DATA_SOURCES'>('WORKFLOWS');
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCatalog = async () => {
      setIsLoading(true);
      try {
        const [wf, ds] = await Promise.all([api.getWorkflows(), api.getDataSources()]);
        setWorkflows(wf);
        setDataSources(ds);
      } catch (e) {
        console.error('Failed to load inventory', e);
      } finally {
        setIsLoading(false);
      }
    };
    fetchCatalog();
  }, []);

  const getSensitivityBadge = (level: string) => {
    switch (level) {
      case 'RESTRICTED_PII':
      case 'RESTRICTED_FINANCIAL':
      case 'RESTRICTED_HEALTH':
        return <span className="badge badge-deny">{level.replace('RESTRICTED_', '')}</span>;
      case 'CONFIDENTIAL':
        return <span className="badge badge-escalate">CONFIDENTIAL</span>;
      case 'INTERNAL':
        return <span className="badge badge-active">INTERNAL</span>;
      case 'PUBLIC':
      default:
        return <span className="badge badge-simulation">PUBLIC</span>;
    }
  };

  const getRiskBadge = (risk: string) => {
    switch (risk) {
      case 'CRITICAL':
      case 'HIGH':
        return <span className="badge badge-deny">{risk}</span>;
      case 'MEDIUM':
        return <span className="badge badge-escalate">MEDIUM</span>;
      case 'LOW':
      default:
        return <span className="badge badge-allow">LOW</span>;
    }
  };

  return (
    <div className="container fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Asset Inventory & Catalog
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Registry of monitored AI workflows and protected enterprise data sources with explicit
          owners, risk tiers, and data sensitivity classifications.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px' }}>
        <button
          onClick={() => setActiveTab('WORKFLOWS')}
          className={`btn ${activeTab === 'WORKFLOWS' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-workflows"
        >
          <Cpu size={16} />
          AI Workflows ({workflows.length})
        </button>
        <button
          onClick={() => setActiveTab('DATA_SOURCES')}
          className={`btn ${activeTab === 'DATA_SOURCES' ? 'btn-primary' : 'btn-secondary'}`}
          id="tab-datasources"
        >
          <Database size={16} />
          Protected Data Sources ({dataSources.length})
        </button>
      </div>

      {/* AI Workflows List */}
      {activeTab === 'WORKFLOWS' && (
        <div className="grid-2">
          {workflows.map((wf) => (
            <div key={wf.id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>{wf.name}</strong>
                    <span className="code-pill">{wf.id}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {wf.description}
                  </div>
                </div>
                <div style={{ display: 'flex', gap: '6px' }}>
                  {getRiskBadge(wf.riskTier)}
                  {wf.active ? (
                    <span className="badge badge-allow">ACTIVE</span>
                  ) : (
                    <span className="badge badge-deny">INACTIVE</span>
                  )}
                </div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Business Unit: </span>
                  <span style={{ color: '#ffffff' }}>{wf.businessUnit}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Model Family: </span>
                  <span style={{ color: '#38bdf8' }}>{wf.modelFamily}</span>
                </div>
                <div style={{ gridColumn: 'span 2' }}>
                  <span style={{ color: 'var(--text-muted)' }}>Owner: </span>
                  <code className="code-pill">{wf.owner}</code>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Data Sources List */}
      {activeTab === 'DATA_SOURCES' && (
        <div className="grid-2">
          {dataSources.map((ds) => (
            <div key={ds.id} className="card">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                    <strong style={{ fontSize: '1.1rem', color: '#ffffff' }}>{ds.name}</strong>
                    <span className="code-pill">{ds.id}</span>
                  </div>
                  <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)' }}>
                    {ds.description}
                  </div>
                </div>
                <div>{getSensitivityBadge(ds.sensitivity)}</div>
              </div>

              <div
                style={{
                  borderTop: '1px solid var(--border-subtle)',
                  paddingTop: '14px',
                  display: 'grid',
                  gridTemplateColumns: 'repeat(2, 1fr)',
                  gap: '10px',
                  fontSize: '0.82rem',
                }}
              >
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Region: </span>
                  <span style={{ color: '#ffffff' }}>{ds.residencyRegion}</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Retention Limit: </span>
                  <span style={{ color: '#ffffff' }}>{ds.retentionDaysLimit} days</span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Contains PII: </span>
                  <span style={{ color: ds.containsPii ? 'var(--deny-red)' : 'var(--allow-green)' }}>
                    {ds.containsPii ? 'Yes (Mandatory Tokenization)' : 'No'}
                  </span>
                </div>
                <div>
                  <span style={{ color: 'var(--text-muted)' }}>Owner: </span>
                  <code className="code-pill">{ds.owner}</code>
                </div>
              </div>

              {ds.tags && ds.tags.length > 0 && (
                <div style={{ marginTop: '12px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  {ds.tags.map((t, idx) => (
                    <span
                      key={idx}
                      style={{
                        fontSize: '0.72rem',
                        padding: '2px 8px',
                        backgroundColor: 'var(--bg-surface)',
                        borderRadius: 'var(--radius-sm)',
                        color: 'var(--text-muted)',
                        border: '1px solid var(--border-subtle)',
                      }}
                    >
                      #{t}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
