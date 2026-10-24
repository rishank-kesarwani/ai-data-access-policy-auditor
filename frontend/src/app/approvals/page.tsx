'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { useAuth } from '@/lib/auth-context';
import { ApprovalRequest } from '@/lib/types';
import {
  GitPullRequest,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  LogIn,
  AlertCircle,
  FileCheck2,
} from 'lucide-react';
import Link from 'next/link';

export default function ApprovalsPage() {
  const { isAuthenticated, user } = useAuth();
  const [approvals, setApprovals] = useState<ApprovalRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<ApprovalRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [reviewDecision, setReviewDecision] = useState<'APPROVE' | 'REJECT'>('APPROVE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const fetchApprovals = async () => {
    if (!isAuthenticated) return;
    setIsLoading(true);
    try {
      const data = await api.getApprovals();
      setApprovals(data);
    } catch (e) {
      console.error('Failed to load approvals', e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApprovals();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const handleOpenReviewModal = (item: ApprovalRequest, decision: 'APPROVE' | 'REJECT') => {
    setSelectedApproval(item);
    setReviewDecision(decision);
    setReviewNotes(
      decision === 'APPROVE'
        ? 'Reviewed and confirmed compliant with enterprise privacy and data access standards.'
        : 'Rejection: Policy rules do not satisfy mandatory least-privilege controls.',
    );
    setStatusMsg(null);
  };

  const handleConfirmReview = async () => {
    if (!selectedApproval) return;
    setIsSubmitting(true);
    setStatusMsg(null);
    try {
      await api.reviewApproval(selectedApproval.id, reviewDecision, reviewNotes);
      setStatusMsg({
        type: 'success',
        text: `Policy approval ${selectedApproval.id} successfully ${reviewDecision.toLowerCase()}d!`,
      });
      setSelectedApproval(null);
      await fetchApprovals();
    } catch (err: any) {
      setStatusMsg({
        type: 'error',
        text: err.response?.data?.message || err.message || 'Review action failed',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="container fade-in" style={{ maxWidth: '640px', textAlign: 'center', padding: '60px 16px' }}>
        <div
          className="card"
          style={{
            padding: '48px 32px',
            backgroundColor: 'var(--bg-surface)',
          }}
        >
          <ShieldAlert size={48} color="#f59e0b" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Protected Governance Queue
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: 1.5, marginBottom: '24px' }}>
            Reviewing and approving authorization policy revisions is an administrative function
            restricted to authenticated Security Operators and Auditors. Public visitors cannot view
            pending governance requests or modify access rules.
          </p>
          <Link href="/login" className="btn btn-primary" id="btn-approvals-signin">
            <LogIn size={16} />
            Sign In as Security Operator
          </Link>
        </div>
      </div>
    );
  }

  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');
  const pastApprovals = approvals.filter((a) => a.status !== 'PENDING');

  return (
    <div className="container fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Policy Change Approvals
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Dual-custody governance workflow for reviewing proposed policy modifications before
          activation. Approving a policy activates the new version and safely archives superseded
          rules.
        </p>
      </div>

      {statusMsg && (
        <div
          style={{
            backgroundColor: statusMsg.type === 'success' ? 'rgba(16, 185, 129, 0.1)' : 'rgba(244, 63, 94, 0.1)',
            border: `1px solid ${statusMsg.type === 'success' ? 'var(--allow-green)' : 'var(--deny-red)'}`,
            borderRadius: 'var(--radius-md)',
            padding: '14px 18px',
            color: '#ffffff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          {statusMsg.type === 'success' ? (
            <CheckCircle2 size={18} color="var(--allow-green)" />
          ) : (
            <AlertCircle size={18} color="var(--deny-red)" />
          )}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Pending Queue */}
      <div className="card" style={{ marginBottom: '32px' }}>
        <div className="card-header">
          <div className="card-title">
            <GitPullRequest size={18} color="#f59e0b" />
            Pending Reviews ({pendingApprovals.length})
          </div>
        </div>

        {pendingApprovals.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '36px 0', color: 'var(--text-muted)' }}>
            No policy changes are currently awaiting review. All active rules are in governance compliance.
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {pendingApprovals.map((item) => (
              <div
                key={item.id}
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  padding: '18px 20px',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-card)',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '16px',
                }}
              >
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                    <span className="badge badge-escalate">PENDING</span>
                    <strong style={{ fontSize: '1rem', color: '#ffffff' }}>{item.policyName}</strong>
                    <span className="code-pill">v{item.policyVersion}</span>
                  </div>
                  <div style={{ fontSize: '0.86rem', color: 'var(--text-secondary)', marginBottom: '8px' }}>
                    Changes: {item.changesSummary}
                  </div>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                    Submitted by: <code className="code-pill">{item.submittedBy}</code> on{' '}
                    {new Date(item.submittedAt).toLocaleString()}
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button
                    onClick={() => handleOpenReviewModal(item, 'APPROVE')}
                    className="btn btn-success btn-sm"
                    id={`btn-approve-${item.id}`}
                  >
                    <CheckCircle2 size={14} />
                    Approve
                  </button>
                  <button
                    onClick={() => handleOpenReviewModal(item, 'REJECT')}
                    className="btn btn-danger btn-sm"
                    id={`btn-reject-${item.id}`}
                  >
                    <XCircle size={14} />
                    Reject
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Historical Approvals */}
      <div className="card">
        <div className="card-header">
          <div className="card-title">
            <Clock size={18} color="#818cf8" />
            Decision Audit History ({pastApprovals.length})
          </div>
        </div>

        <div className="table-responsive">
          <table className="data-table">
            <thead>
              <tr>
                <th>Request ID</th>
                <th>Policy Name</th>
                <th>Version</th>
                <th>Outcome</th>
                <th>Reviewed By</th>
                <th>Review Notes</th>
                <th>Date</th>
              </tr>
            </thead>
            <tbody>
              {pastApprovals.map((a) => (
                <tr key={a.id}>
                  <td>
                    <span className="code-pill">{a.id}</span>
                  </td>
                  <td>{a.policyName}</td>
                  <td>v{a.policyVersion}</td>
                  <td>
                    {a.status === 'APPROVED' ? (
                      <span className="badge badge-allow">APPROVED</span>
                    ) : (
                      <span className="badge badge-deny">REJECTED</span>
                    )}
                  </td>
                  <td>{a.reviewedBy || 'N/A'}</td>
                  <td style={{ maxWidth: '300px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                    {a.reviewNotes || 'N/A'}
                  </td>
                  <td style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                    {a.reviewedAt ? new Date(a.reviewedAt).toLocaleDateString() : 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Review Confirmation Modal */}
      {selectedApproval && (
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
                {reviewDecision === 'APPROVE' ? (
                  <CheckCircle2 size={18} color="var(--allow-green)" />
                ) : (
                  <XCircle size={18} color="var(--deny-red)" />
                )}
                {reviewDecision === 'APPROVE' ? 'Approve & Activate Policy' : 'Reject Policy Revision'}
              </div>
            </div>

            <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginBottom: '16px' }}>
              Target: <strong>{selectedApproval.policyName} (v{selectedApproval.policyVersion})</strong>
            </p>

            <div className="form-group">
              <label className="form-label">Reviewer Governance Notes</label>
              <textarea
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                className="form-textarea"
                rows={4}
                id="textarea-review-notes"
              />
            </div>

            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '10px', marginTop: '20px' }}>
              <button
                onClick={() => setSelectedApproval(null)}
                className="btn btn-secondary"
                id="btn-cancel-review"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReview}
                disabled={isSubmitting || !reviewNotes.trim()}
                className={`btn ${reviewDecision === 'APPROVE' ? 'btn-success' : 'btn-danger'}`}
                id="btn-confirm-review"
              >
                {isSubmitting
                  ? 'Recording...'
                  : reviewDecision === 'APPROVE'
                  ? 'Confirm Approval'
                  : 'Confirm Rejection'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
