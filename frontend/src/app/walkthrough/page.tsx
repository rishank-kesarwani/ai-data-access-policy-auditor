'use client';

import React, { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { PolicyEvaluationResult } from '@/lib/types';
import {
  Compass,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  PlayCircle,
  ArrowRight,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import Link from 'next/link';

export default function WalkthroughPage() {
  const [scenarios, setScenarios] = useState<any[]>([]);
  const [activeScenarioId, setActiveScenarioId] = useState<string>('');
  const [evalResult, setEvalResult] = useState<PolicyEvaluationResult | null>(null);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    const fetchScenarios = async () => {
      try {
        const list = await api.getWalkthroughScenarios();
        setScenarios(list);
        if (list.length > 0) {
          setActiveScenarioId(list[0].scenarioId);
        }
      } catch (e) {
        console.error('Failed to load scenarios', e);
      }
    };
    fetchScenarios();
  }, []);

  const activeScenario = scenarios.find((s) => s.scenarioId === activeScenarioId);

  const handleExecuteScenario = async (sc: any) => {
    setIsRunning(true);
    setEvalResult(null);
    try {
      const res = await api.simulateAccessRequest(sc.request);
      setEvalResult(res);
    } catch (e) {
      console.error('Execution failed', e);
    } finally {
      setIsRunning(false);
    }
  };

  const getDecisionBadge = (decision: string) => {
    if (decision === 'ALLOW') return <span className="badge badge-allow">ALLOW</span>;
    if (decision === 'DENY') return <span className="badge badge-deny">DENY</span>;
    return <span className="badge badge-escalate">ESCALATE</span>;
  };

  return (
    <div className="container fade-in">
      <div style={{ marginBottom: '28px' }}>
        <h1 style={{ fontSize: '1.8rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
          Interactive Governance Walkthrough
        </h1>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem' }}>
          Demonstrates deterministic policy evaluation across ALLOW, DENY, and ESCALATE outcomes.
          Notice how explicit DENY overrides ALLOW, how conditions are strictly verified, and how
          unregistered assets safely default-deny.
        </p>
      </div>

      <div className="grid-3" style={{ alignItems: 'flex-start' }}>
        {/* Scenario Selector on Left */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--text-muted)' }}>
            DEMO SCENARIOS
          </div>

          {scenarios.map((sc, index) => {
            const isSelected = sc.scenarioId === activeScenarioId;
            return (
              <div
                key={sc.scenarioId}
                onClick={() => {
                  setActiveScenarioId(sc.scenarioId);
                  setEvalResult(null);
                }}
                className="card"
                style={{
                  padding: '16px',
                  cursor: 'pointer',
                  borderColor: isSelected ? 'var(--primary)' : 'var(--border-card)',
                  backgroundColor: isSelected ? 'var(--bg-card-hover)' : 'var(--bg-card)',
                }}
                id={`scenario-card-${index}`}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                    Step {index + 1}
                  </span>
                  {getDecisionBadge(sc.expectedOutcome)}
                </div>
                <strong style={{ fontSize: '0.92rem', color: '#ffffff', display: 'block', marginBottom: '4px' }}>
                  {sc.title.split(':')[1]?.trim() || sc.title}
                </strong>
                <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', lineHeight: 1.4 }}>
                  {sc.description.substring(0, 95)}...
                </p>
              </div>
            );
          })}
        </div>

        {/* Detailed Scenario Explanation & Runner on Right */}
        <div style={{ gridColumn: 'span 2' }}>
          {activeScenario && (
            <div className="card fade-in">
              <div className="card-header">
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#ffffff' }}>
                      {activeScenario.title}
                    </h2>
                    {getDecisionBadge(activeScenario.expectedOutcome)}
                  </div>
                  <p style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', marginTop: '6px' }}>
                    {activeScenario.description}
                  </p>
                </div>
              </div>

              {/* Request Payload Breakdown */}
              <div
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderRadius: 'var(--radius-md)',
                  padding: '16px',
                  marginBottom: '20px',
                  border: '1px solid var(--border-subtle)',
                }}
              >
                <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)', marginBottom: '10px' }}>
                  SYNTHETIC EVALUATION PAYLOAD
                </div>

                <div className="grid-2" style={{ fontSize: '0.84rem', gap: '10px' }}>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Workflow: </span>
                    <span style={{ color: '#ffffff' }}>{activeScenario.request.workflowId}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Data Source: </span>
                    <span style={{ color: '#ffffff' }}>{activeScenario.request.dataSourceId}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Action: </span>
                    <span style={{ color: '#38bdf8' }}>{activeScenario.request.action}</span>
                  </div>
                  <div>
                    <span style={{ color: 'var(--text-muted)' }}>Purpose: </span>
                    <span style={{ color: '#ffffff' }}>{activeScenario.request.purpose}</span>
                  </div>
                </div>

                <div style={{ marginTop: '12px', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '10px' }}>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginBottom: '4px' }}>
                    Context Attributes:
                  </div>
                  <code className="code-pill">
                    {JSON.stringify(activeScenario.request.context)}
                  </code>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginBottom: '24px' }}>
                <button
                  onClick={() => handleExecuteScenario(activeScenario)}
                  disabled={isRunning}
                  className="btn btn-primary"
                  id="btn-run-scenario"
                >
                  <PlayCircle size={16} />
                  {isRunning ? 'Evaluating...' : 'Execute Evaluation in Engine'}
                </button>
                <Link
                  href="/simulator"
                  className="btn btn-secondary"
                  id="btn-open-in-simulator"
                >
                  Open in Custom Simulator <ArrowRight size={14} />
                </Link>
              </div>

              {/* Execution Outcome */}
              {evalResult && (
                <div
                  className="fade-in"
                  style={{
                    borderTop: '1px solid var(--border-card)',
                    paddingTop: '20px',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '12px' }}>
                    {getDecisionBadge(evalResult.decision)}
                    <strong style={{ fontSize: '1rem', color: '#ffffff' }}>
                      Deterministic Engine Decision: {evalResult.decision}
                    </strong>
                  </div>

                  <div
                    style={{
                      padding: '14px 16px',
                      backgroundColor: 'var(--bg-canvas)',
                      borderRadius: 'var(--radius-md)',
                      border: '1px solid var(--border-subtle)',
                      fontSize: '0.88rem',
                      lineHeight: 1.5,
                      color: '#ffffff',
                      marginBottom: '16px',
                    }}
                  >
                    {evalResult.rationale}
                  </div>

                  {evalResult.aiExplanation && (
                    <div
                      style={{
                        padding: '14px 16px',
                        backgroundColor: 'rgba(99, 102, 241, 0.08)',
                        border: '1px solid rgba(99, 102, 241, 0.25)',
                        borderRadius: 'var(--radius-md)',
                        fontSize: '0.84rem',
                        lineHeight: 1.5,
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px', color: '#818cf8', fontWeight: 600 }}>
                        <Sparkles size={14} />
                        Explainable Governance Summary:
                      </div>
                      <div style={{ whiteSpace: 'pre-wrap' }}>{evalResult.aiExplanation}</div>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
