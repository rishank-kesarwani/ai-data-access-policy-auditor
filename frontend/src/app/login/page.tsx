'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { ShieldCheck, Lock, LogIn, AlertCircle, Info, CheckCircle2 } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login, isPublicMode, isAuthenticated, user, logout } = useAuth();
  const [email, setEmail] = useState('admin@secops.internal');
  const [password, setPassword] = useState('admin123!');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setErrorMsg(null);
    try {
      await login(password, email);
      router.push('/');
    } catch (err: any) {
      setErrorMsg(
        err.response?.data?.message || err.message || 'Authentication failed. Please verify credentials.',
      );
    } finally {
      setIsLoading(false);
    }
  };

  if (isAuthenticated) {
    return (
      <div className="container fade-in" style={{ maxWidth: '480px', padding: '60px 16px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '40px 28px' }}>
          <CheckCircle2 size={44} color="var(--allow-green)" style={{ margin: '0 auto 16px' }} />
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff', marginBottom: '8px' }}>
            Authenticated Session Active
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: '20px' }}>
            Signed in as <strong>{user?.email}</strong> with role{' '}
            <span className="badge badge-active">{user?.role}</span>.
          </p>
          <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
            <button onClick={() => router.push('/policies')} className="btn btn-primary">
              Manage Policies
            </button>
            <button onClick={logout} className="btn btn-secondary">
              Sign Out
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container fade-in" style={{ maxWidth: '480px', padding: '40px 16px' }}>
      <div className="card" style={{ padding: '36px 28px' }}>
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div
            style={{
              width: '44px',
              height: '44px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 12px',
            }}
          >
            <Lock size={22} color="#ffffff" />
          </div>
          <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: '#ffffff' }}>
            Security Operator Sign In
          </h2>
          <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '4px' }}>
            Authenticate to unlock policy editing, approvals, and private audit trails.
          </p>
        </div>

        {errorMsg && (
          <div
            style={{
              backgroundColor: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid var(--deny-red)',
              borderRadius: 'var(--radius-md)',
              padding: '12px 16px',
              color: '#ffffff',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              fontSize: '0.85rem',
            }}
          >
            <AlertCircle size={16} color="var(--deny-red)" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label className="form-label">Operator Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="form-input"
              required
              id="input-login-email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Master Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="form-input"
              required
              id="input-login-password"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '8px' }}
            id="btn-submit-login"
          >
            <LogIn size={16} />
            {isLoading ? 'Verifying...' : 'Sign In'}
          </button>
        </form>

        {/* Demo Credentials Info */}
        <div
          style={{
            marginTop: '24px',
            borderTop: '1px solid var(--border-subtle)',
            paddingTop: '16px',
            fontSize: '0.78rem',
            color: 'var(--text-muted)',
            lineHeight: 1.5,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '6px' }}>
            <Info size={14} color="#38bdf8" />
            <strong style={{ color: 'var(--text-secondary)' }}>Demo Environment Credentials:</strong>
          </div>
          <div>Admin: <code className="code-pill">admin@secops.internal</code> / <code className="code-pill">admin123!</code></div>
          <div style={{ marginTop: '2px' }}>Auditor: <code className="code-pill">auditor@secops.internal</code> / <code className="code-pill">admin123!</code></div>
        </div>
      </div>
    </div>
  );
}
