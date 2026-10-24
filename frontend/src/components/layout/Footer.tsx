import React from 'react';
import { ShieldCheck, Lock, Cpu, Database } from 'lucide-react';

export function Footer() {
  return (
    <footer
      style={{
        borderTop: '1px solid var(--border-subtle)',
        backgroundColor: 'var(--bg-canvas)',
        padding: '36px 0 24px',
        marginTop: '60px',
        color: 'var(--text-muted)',
        fontSize: '0.85rem',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '20px',
            marginBottom: '20px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <ShieldCheck size={18} color="#818cf8" />
            <span style={{ fontWeight: 600, color: 'var(--text-primary)' }}>
              AI Data Access & Policy Auditor
            </span>
          </div>

          <div
            style={{
              display: 'flex',
              gap: '24px',
              flexWrap: 'wrap',
              fontSize: '0.8rem',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Lock size={14} color="#10b981" />
              <span>Safe Default-Deny Precedence</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Database size={14} color="#38bdf8" />
              <span>Cryptographic Hash Chaining</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Cpu size={14} color="#818cf8" />
              <span>Explainable AI Synthesis</span>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid rgba(255, 255, 255, 0.05)',
            paddingTop: '16px',
            display: 'flex',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <p>
            © {new Date().getFullYear()} Enterprise AI Governance Architecture. All rights reserved.
          </p>
          <p style={{ color: 'var(--text-dim)', fontSize: '0.78rem' }}>
            Notice: Simulations evaluate policy rules and do not directly modify cloud or database ACLs.
          </p>
        </div>
      </div>
    </footer>
  );
}
