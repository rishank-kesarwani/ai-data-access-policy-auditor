'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import {
  ActionType,
  DataSource,
  PolicyEvaluationResult,
  PurposeType,
  Workflow,
} from '@/lib/types';
import {
  PlayCircle,
  ShieldCheck,
  AlertTriangle,
  XCircle,
  CheckCircle2,
  Cpu,
  Sparkles,
  Info,
  Clock,
  Key,
  Layers,
  ArrowRight,
} from 'lucide-react';

export default function SimulatorPage() {
  const [workflows, setWorkflows] = useState<Workflow[]>([]);
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [scenarios, setScenarios] = useState<any[]>([]);

  // Simulation Form state
  const [selectedWorkflow, setSelectedWorkflow] = useState<string>('');
  const [selectedDataSource, setSelectedDataSource] = useState<string>('');
  const [selectedAction, setSelectedAction] = useState<ActionType>('READ');
  const [selectedPurpose, setSelectedPurpose] = useState<PurposeType>('CUSTOMER_SUPPORT');

  // Context conditions
  const [piiTokenized, setPiiTokenized] = useState<boolean>(true);
  const [userConsent, setUserConsent] = useState<boolean>(true);
  const [mfaVerified, setMfaVerified] = useState<boolean>(true);
  const [tenantEnforced, setTenantEnforced] = useState<boolean>(true);

  // Results
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [result, setResult] = useState<PolicyEvaluationResult | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const fetchCatalog = async () => {
      try {
        const [wfList, dsList, scList] = await Promise.all([
          api.getWorkflows(),
          api.getDataSources(),
          api.getWalkthroughScenarios(),
        ]);
        setWorkflows(wfList);
        setDataSources(dsList);
        setScenarios(scList);

        if (wfList.length > 0) setSelectedWorkflow(wfList[0].id);
        if (dsList.length > 0) setSelectedDataSource(dsList[0].id);
      } catch (e) {
        console.error('Failed to load catalog', e);
      }
    };
    fetchCatalog();
  }, []);

  const handleRunSimulation = async (customPayload?: any) => {
    setIsEvaluating(true);
    setErrorMsg(null);

    const payload = customPayload || {
      workflowId: selectedWorkflow,
      dataSourceId: selectedDataSource,
      action: selectedAction,
      purpose: selectedPurpose,
      principal: {
        userId: 'simulated-operator-01',
        role: 'AI_AGENT',
        mfaVerified,
      },
      context: {
        pii_tokenized: piiTokenized,
        user_consent_verified: userConsent,
        mfa_verified: mfaVerified,
        tenant_boundary_enforced: tenantEnforced,
        retention_days: 30,
      },
      isSimulation: true,
      notes: 'Executed via interactive web simulator',
    };

    try {
      const evalRes = await api.simulateAccessRequest(payload);
      setResult(evalRes);
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Simulation request failed',
      );
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleLoadScenario = (sc: any) => {
    setSelectedWorkflow(sc.request.workflowId);
    setSelectedDataSource(sc.request.dataSourceId);
    setSelectedAction(sc.request.action);
    setSelectedPurpose(sc.request.purpose);
    setPiiTokenized(Boolean(sc.request.context?.pii_tokenized));
    setUserConsent(Boolean(sc.request.context?.user_consent_verified));
    setMfaVerified(Boolean(sc.request.context?.mfa_verified));
    setTenantEnforced(Boolean(sc.request.context?.tenant_boundary_enforced));

    handleRunSimulation(sc.request);
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === 'ALLOW') return <span className="badge badge-allow">ALLOW</span>;
    if (decision === 'DENY') return <span className="badge badge-deny">DENY</span>;
    return <span className="badge badge-escalate">ESCALATE</span>;
  };

  return (
    <div className="container fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Access Request Decision Simulator
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Evaluate synthetic AI data access requests against active enterprise authorization policies.
          Inspect deterministic rule outcomes, condition evaluations, and explainable summaries.
        </p>
      </div>

      {/* Safety Notice Banner */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          padding: '14px 18px',
          backgroundColor: 'rgba(6, 182, 212, 0.08)',
          border: '1px solid rgba(6, 182, 212, 0.25)',
          borderRadius: 'var(--radius-md)',
          marginBottom: '28px',
        }}
      >
        <Info size={18} color="#38bdf8" />
        <span style={{ fontSize: '0.85rem', color: '#e0f2fe' }}>
          <strong>Simulation Sandbox:</strong> All requests here are evaluated with{' '}
          <code className="code-pill">isSimulation: true</code>. Evaluation demonstrates policy
          compliance and does not grant or modify actual database or cloud permissions.
        </span>
      </div>

      {/* Quick Scenario Pre-sets */}
      <div style={{ marginBottom: '28px' }}>
        <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
          LOAD SYNTHETIC SCENARIO:
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          {scenarios.map((sc) => (
            <button
              key={sc.scenarioId}
              onClick={() => handleLoadScenario(sc)}
              className="btn btn-secondary btn-sm"
              id={`btn-preset-${sc.scenarioId}`}
            >
              <Sparkles size={13} color="#818cf8" />
              {sc.title.split(':')[0]} ({sc.expectedOutcome})
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Form on Left, Output on Right */}
      <div className="grid-2" style={{ alignItems: 'flex-start' }}>
        {/* Input Parameters Form */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">
              <PlayCircle size={18} color="#818cf8" />
              Request Attributes
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">AI Workflow Principal</label>
            <select
              value={selectedWorkflow}
              onChange={(e) => setSelectedWorkflow(e.target.value)}
              className="form-select"
              id="select-workflow"
            >
              {workflows.map((w) => (
                <option key={w.id} value={w.id}>
                  {w.name} ({w.id}) {!w.active ? '[INACTIVE]' : ''}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target Data Source</label>
            <select
              value={selectedDataSource}
              onChange={(e) => setSelectedDataSource(e.target.value)}
              className="form-select"
              id="select-datasource"
            >
              {dataSources.map((ds) => (
                <option key={ds.id} value={ds.id}>
                  {ds.name} [{ds.sensitivity}]
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div className="form-group">
              <label className="form-label">Requested Action</label>
              <select
                value={selectedAction}
                onChange={(e) => setSelectedAction(e.target.value as ActionType)}
                className="form-select"
                id="select-action"
              >
                <option value="READ">READ (Query / Retrieve)</option>
                <option value="TRAIN">TRAIN (Raw Training)</option>
                <option value="EMBED">EMBED (Vectorize)</option>
                <option value="FINE_TUNE">FINE_TUNE (Model Adapt)</option>
                <option value="INFER">INFER (Runtime Prompt)</option>
                <option value="EXPORT">EXPORT (Bulk Export)</option>
                <option value="CACHE">CACHE (Offline Store)</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Business Purpose</label>
              <select
                value={selectedPurpose}
                onChange={(e) => setSelectedPurpose(e.target.value as PurposeType)}
                className="form-select"
                id="select-purpose"
              >
                <option value="CUSTOMER_SUPPORT">CUSTOMER_SUPPORT</option>
                <option value="RAG_RETRIEVAL">RAG_RETRIEVAL</option>
                <option value="ANALYTICS">ANALYTICS</option>
                <option value="MODEL_TRAINING">MODEL_TRAINING</option>
                <option value="FRAUD_DETECTION">FRAUD_DETECTION</option>
                <option value="OPERATIONAL_DEBUGGING">OPERATIONAL_DEBUGGING</option>
              </select>
            </div>
          </div>

          {/* Context Attributes & Toggles */}
          <div style={{ marginTop: '12px', borderTop: '1px solid var(--border-subtle)', paddingTop: '16px' }}>
            <div style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '12px' }}>
              Execution Context & Privacy Safeguards
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={piiTokenized}
                  onChange={(e) => setPiiTokenized(e.target.checked)}
                  id="toggle-pii"
                />
                <span>PII Masking & Tokenization Active (pii_tokenized)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={userConsent}
                  onChange={(e) => setUserConsent(e.target.checked)}
                  id="toggle-consent"
                />
                <span>End-User Consent Verified (user_consent_verified)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={mfaVerified}
                  onChange={(e) => setMfaVerified(e.target.checked)}
                  id="toggle-mfa"
                />
                <span>Operator MFA Step-Up Verified (mfa_verified)</span>
              </label>

              <label style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem', cursor: 'pointer' }}>
                <input
                  type="checkbox"
                  checked={tenantEnforced}
                  onChange={(e) => setTenantEnforced(e.target.checked)}
                  id="toggle-tenant"
                />
                <span>Multi-Tenant Isolation Enforced (tenant_boundary_enforced)</span>
              </label>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button
              onClick={() => handleRunSimulation()}
              disabled={isEvaluating}
              className="btn btn-primary btn-lg"
              style={{ width: '100%' }}
              id="btn-evaluate-simulation"
            >
              <PlayCircle size={18} />
              {isEvaluating ? 'Evaluating Policy Rules...' : 'Evaluate Access Request'}
            </button>
          </div>
        </div>

        {/* Results Panel */}
        <div>
          {errorMsg && (
            <div
              style={{
                backgroundColor: 'rgba(244, 63, 94, 0.1)',
                border: '1px solid var(--deny-red)',
                borderRadius: 'var(--radius-md)',
                padding: '16px',
                color: '#ffffff',
                marginBottom: '20px',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontWeight: 600 }}>
                <AlertTriangle size={16} color="var(--deny-red)" />
                Evaluation Error
              </div>
              <div style={{ fontSize: '0.85rem', marginTop: '4px' }}>{errorMsg}</div>
            </div>
          )}

          {result ? (
            <div className="card fade-in">
              <div className="card-header">
                <div>
                  <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>Decision Outcome</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '6px' }}>
                    {getDecisionBadge(result.decision)}
                    <span style={{ fontSize: '1.2rem', fontWeight: 700, color: '#ffffff' }}>
                      {result.decision === 'ALLOW' && 'Access Permitted'}
                      {result.decision === 'DENY' && 'Access Denied'}
                      {result.decision === 'ESCALATE' && 'Human Review Required'}
                    </span>
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Audit Record ID</div>
                  <div className="code-pill" style={{ marginTop: '4px' }}>
                    {result.auditRecordId || result.requestId}
                  </div>
                </div>
              </div>

              {/* Rationale */}
              <div
                style={{
                  padding: '14px 16px',
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  border: '1px solid var(--border-subtle)',
                  marginBottom: '16px',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '4px' }}>
                  DETERMINISTIC RATIONALE
                </div>
                <div style={{ fontSize: '0.9rem', color: '#ffffff', lineHeight: 1.5 }}>
                  {result.rationale}
                </div>
              </div>

              {/* Policy Match Breakdown */}
              <div style={{ marginBottom: '16px' }}>
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                  MATCHED POLICY & RULE
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                  Policy:{' '}
                  <strong style={{ color: '#ffffff' }}>
                    {result.matchedPolicyName || 'None (Safe Default-Deny Rule Triggered)'}
                  </strong>{' '}
                  {result.matchedPolicyVersion && `(v${result.matchedPolicyVersion})`}
                </div>
                {result.matchedRuleId && (
                  <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
                    Rule ID: <code className="code-pill">{result.matchedRuleId}</code>
                  </div>
                )}
              </div>

              {/* Conditions Evaluated */}
              {result.evaluatedConditions && result.evaluatedConditions.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '8px' }}>
                    CONDITIONS EVALUATION
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {result.evaluatedConditions.map((cond, idx) => (
                      <div
                        key={idx}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '10px 14px',
                          backgroundColor: 'var(--bg-surface)',
                          borderRadius: 'var(--radius-sm)',
                          border: `1px solid ${cond.satisfied ? 'rgba(16, 185, 129, 0.3)' : 'rgba(244, 63, 94, 0.3)'}`,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          {cond.satisfied ? (
                            <CheckCircle2 size={16} color="var(--allow-green)" />
                          ) : (
                            <XCircle size={16} color="var(--deny-red)" />
                          )}
                          <span style={{ fontSize: '0.85rem', color: '#ffffff' }}>
                            {cond.conditionName}
                          </span>
                        </div>
                        <span style={{ fontSize: '0.78rem', color: cond.satisfied ? 'var(--allow-green)' : 'var(--deny-red)' }}>
                          {cond.satisfied ? 'Satisfied' : 'Failed'}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Missing Requirements if denied */}
              {result.missingRequirements && result.missingRequirements.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--deny-red)', marginBottom: '6px' }}>
                    UNMET REQUIREMENTS:
                  </div>
                  <ul style={{ paddingLeft: '20px', fontSize: '0.84rem', color: '#fca5a5' }}>
                    {result.missingRequirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* AI Governance Explanation */}
              {result.aiExplanation && (
                <div
                  style={{
                    padding: '16px',
                    backgroundColor: 'rgba(99, 102, 241, 0.08)',
                    border: '1px solid rgba(99, 102, 241, 0.25)',
                    borderRadius: 'var(--radius-md)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                    <Sparkles size={16} color="#818cf8" />
                    <strong style={{ fontSize: '0.82rem', color: '#c7d2fe' }}>
                      {result.aiPlatformUsed
                        ? 'Railway AI Platform Governance Synthesis'
                        : 'Deterministic Governance Summary'}
                    </strong>
                  </div>
                  <div
                    style={{
                      fontSize: '0.84rem',
                      color: 'var(--text-secondary)',
                      lineHeight: 1.6,
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {result.aiExplanation}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div
              className="card"
              style={{
                textAlign: 'center',
                padding: '60px 24px',
                color: 'var(--text-muted)',
              }}
            >
              <Cpu size={48} color="#475569" style={{ margin: '0 auto 16px' }} />
              <div style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                No Simulation Executed Yet
              </div>
              <p style={{ fontSize: '0.85rem', marginTop: '6px', maxWidth: '380px', margin: '6px auto 0' }}>
                Select workflow attributes on the left or load a synthetic pre-set above, then click
                &quot;Evaluate Access Request&quot;.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
