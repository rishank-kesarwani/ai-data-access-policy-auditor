'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { Policy, PolicyRule } from '@/lib/types';
import {
  FileCheck2,
  Plus,
  GitPullRequest,
  CheckCircle2,
  AlertCircle,
  Clock,
  Archive,
  ChevronDown,
  ChevronUp,
  Shield,
  Filter,
} from 'lucide-react';
import Link from 'next/link';

export default function PoliciesPage() {
  const { isAuthenticated, isPublicMode } = useAuth();
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>('ALL');
  const [expandedPolicyId, setExpandedPolicyId] = useState<string | null>(null);

  // Submit Approval Modal State
  const [submittingPolicy, setSubmittingPolicy] = useState<Policy | null>(null);
  const [approvalSummary, setApprovalSummary] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionSuccessMsg, setActionSuccessMsg] = useState<string | null>(null);
  const [actionErrorMsg, setActionErrorMsg] = useState<string | null>(null);

  const fetchPolicies = async () => {
    try {
      const data = await api.getPolicies();
      setPolicies(data);
      if (data.length > 0 && !expandedPolicyId) {
        setExpandedPolicyId(data[0].id);
      }
    } catch (e) {
      console.error('Failed to load policies', e);
    }
  };

  useEffect(() => {
    fetchPolicies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleOpenSubmitModal = (policy: Policy) => {
    if (!isAuthenticated) {
      setActionErrorMsg('Authentication required to submit policies for approval. Please sign in as an operator.');
      return;
    }
    setSubmittingPolicy(policy);
    setApprovalSummary(`Proposing activation of ${policy.name} (v${policy.version})`);
    setActionErrorMsg(null);
  };

  const handleConfirmSubmitApproval = async () => {
    if (!submittingPolicy) return;
    setIsSubmitting(true);
    setActionErrorMsg(null);
    try {
      await api.submitForApproval(submittingPolicy.id, approvalSummary);
      setActionSuccessMsg(`Policy "${submittingPolicy.name}" submitted to SecOps approval queue.`);
      setSubmittingPolicy(null);
      await fetchPolicies();
    } catch (err: any) {
      setActionErrorMsg(err.response?.data?.message || err.message || 'Submission failed');
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredPolicies = policies.filter((p) => {
    if (filterStatus === 'ALL') return true;
    return p.status === filterStatus;
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <span className="badge badge-allow">ACTIVE</span>;
      case 'PENDING_APPROVAL':
        return <span className="badge badge-escalate">PENDING APPROVAL</span>;
      case 'DRAFT':
        return <span className="badge badge-draft">DRAFT</span>;
      case 'REJECTED':
        return <span className="badge badge-deny">REJECTED</span>;
      case 'ARCHIVED':
        return <span className="badge badge-draft">ARCHIVED</span>;
      default:
        return <span className="badge badge-draft">{status}</span>;
    }
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
            Policy Registry & Governance Rules
          </h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
            Versioned zero-trust policies specifying allowed actions, denied actions, resource
            scopes, and required compliance conditions.
          </p>
        </div>

        <div style={{ display: 'flex', gap: '10px' }}>
          {!isAuthenticated && isPublicMode && (
            <Link href="/login" className="btn btn-secondary btn-sm" id="btn-signin-notice">
              Sign in to Edit Policies
            </Link>
          )}
        </div>
      </div>

      {actionSuccessMsg && (
        <div
          style={{
            backgroundColor: 'rgba(16, 185, 129, 0.1)',
            border: '1px solid var(--allow-green)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#ffffff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <CheckCircle2 size={18} color="var(--allow-green)" />
          <span>{actionSuccessMsg}</span>
        </div>
      )}

      {actionErrorMsg && (
        <div
          style={{
            backgroundColor: 'rgba(244, 63, 94, 0.1)',
            border: '1px solid var(--deny-red)',
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#ffffff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <AlertCircle size={18} color="var(--deny-red)" />
          <span>{actionErrorMsg}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {['ALL', 'ACTIVE', 'PENDING_APPROVAL', 'DRAFT', 'ARCHIVED'].map((st) => (
          <button
            key={st}
            onClick={() => setFilterStatus(st)}
            className={`btn btn-sm ${filterStatus === st ? 'btn-primary' : 'btn-secondary'}`}
            id={`filter-${st}`}
          >
            {st.replace('_', ' ')}
          </button>
        ))}
      </div>

      {/* Policy Cards List */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {filteredPolicies.map((policy) => {
          const isExpanded = expandedPolicyId === policy.id;
          return (
            <div key={policy.id} className="card">
              <div
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  flexWrap: 'wrap',
                  gap: '12px',
                }}
                onClick={() => setExpandedPolicyId(isExpanded ? null : policy.id)}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#ffffff' }}>
                      {policy.name}
                    </h3>
                    <span className="code-pill">v{policy.version}</span>
                    {getStatusBadge(policy.status)}
                  </div>
                  <p style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    {policy.description}
                  </p>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  {policy.status === 'DRAFT' && isAuthenticated && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenSubmitModal(policy);
                      }}
                      className="btn btn-secondary btn-sm"
                      id={`btn-submit-${policy.id}`}
                    >
                      <GitPullRequest size={14} color="#818cf8" />
                      Submit for Approval
                    </button>
                  )}
                  {isExpanded ? <ChevronUp size={20} color="#94a3b8" /> : <ChevronDown size={20} color="#94a3b8" />}
                </div>
              </div>

              {/* Collapsible Rules Details */}
              {isExpanded && (
                <div style={{ marginTop: '20px', borderTop: '1px solid var(--border-card)', paddingTop: '20px' }}>
                  <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '14px' }}>
                    CONFIGURED RULES ({policy.rules?.length || 0})
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    {policy.rules?.map((rule) => (
                      <div
                        key={rule.id}
                        style={{
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-md)',
                          padding: '16px',
                          border: `1px solid ${
                            rule.effect === 'ALLOW'
                              ? 'rgba(16, 185, 129, 0.25)'
                              : rule.effect === 'DENY'
                              ? 'rgba(244, 63, 94, 0.25)'
                              : 'rgba(245, 158, 11, 0.25)'
                          }`,
                        }}
                      >
                        <div
                          style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            marginBottom: '10px',
                            flexWrap: 'wrap',
                            gap: '8px',
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span
                              className={`badge ${
                                rule.effect === 'ALLOW'
                                  ? 'badge-allow'
                                  : rule.effect === 'DENY'
                                  ? 'badge-deny'
                                  : 'badge-escalate'
                              }`}
                            >
                              {rule.effect}
                            </span>
                            <span className="code-pill">{rule.id}</span>
                            <strong style={{ fontSize: '0.88rem', color: '#ffffff' }}>
                              {rule.description}
                            </strong>
                          </div>
                        </div>

                        {/* Scopes Grid */}
                        <div className="grid-3" style={{ fontSize: '0.82rem', gap: '10px' }}>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Actions: </span>
                            <span style={{ color: '#ffffff' }}>{rule.actions?.join(', ')}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Purposes: </span>
                            <span style={{ color: '#ffffff' }}>{rule.purposes?.join(', ')}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Workflows: </span>
                            <span style={{ color: '#ffffff' }}>{rule.workflowScope?.join(', ')}</span>
                          </div>
                          <div>
                            <span style={{ color: 'var(--text-muted)' }}>Data Sources: </span>
                            <span style={{ color: '#ffffff' }}>{rule.dataSourceScope?.join(', ')}</span>
                          </div>
                        </div>

                        {/* Conditions List */}
                        {rule.conditions && rule.conditions.length > 0 && (
                          <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.05)', paddingTop: '10px' }}>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '6px' }}>
                              MANDATORY CONDITIONS:
                            </div>
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                              {rule.conditions.map((c, ci) => (
                                <span
                                  key={ci}
                                  style={{
                                    fontSize: '0.78rem',
                                    padding: '4px 8px',
                                    backgroundColor: 'var(--bg-input)',
                                    borderRadius: '4px',
                                    border: '1px solid var(--border-subtle)',
                                    color: '#38bdf8',
                                  }}
                                >
                                  {c.name} {c.operator} {JSON.stringify(c.expectedValue)}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Submit Approval Modal */}
      {submittingPolicy && (
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
            style={{ width: '100%', maxWidth: '520px', backgroundColor: 'var(--bg-surface)' }}
          >
            <div className="card-header">
              <div className="card-title">
                <GitPullRequest size={18} color="#818cf8" />
                Submit Policy Revision for Approval
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Submitting <strong>{submittingPolicy.name} (v{submittingPolicy.version})</strong> to the
              governance review queue. Railway Notification Service will alert authorized reviewers.
            </p>

            <div className="form-group">
              <label className="form-label">Summary of Policy Changes</label>
              <textarea
                value={approvalSummary}
                onChange={(e) => setApprovalSummary(e.target.value)}
                className="form-textarea"
                rows={4}
                placeholder="Explain the authorization changes and data security impact..."
                id="textarea-approval-summary"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setSubmittingPolicy(null)}
                className="btn btn-secondary"
                id="btn-cancel-modal"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmSubmitApproval}
                disabled={isSubmitting || !approvalSummary.trim()}
                className="btn btn-primary"
                id="btn-confirm-submit"
              >
                {isSubmitting ? 'Submitting...' : 'Submit to SecOps Queue'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
