'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import {
  ShieldCheck,
  PlayCircle,
  FileCheck2,
  GitPullRequest,
  History,
  Database,
  Compass,
  Lock,
  LogOut,
  LogIn,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';

export function Navbar() {
  const pathname = usePathname();
  const { user, isAuthenticated, isPublicMode, logout } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { href: '/', label: 'Overview', icon: ShieldCheck },
    { href: '/simulator', label: 'Simulator', icon: PlayCircle },
    { href: '/policies', label: 'Policies', icon: FileCheck2 },
    { href: '/approvals', label: 'Approvals', icon: GitPullRequest },
    { href: '/audit', label: 'Audit Trail', icon: History },
    { href: '/inventory', label: 'Inventory', icon: Database },
    { href: '/walkthrough', label: 'Demo Tour', icon: Compass },
  ];

  return (
    <header
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.92)',
        backdropFilter: 'blur(12px)',
        borderBottom: '1px solid var(--border-card)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
        }}
      >
        {/* Brand */}
        <Link
          href="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #6366f1, #38bdf8)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 0 15px rgba(99, 102, 241, 0.4)',
            }}
          >
            <ShieldCheck size={22} color="#ffffff" />
          </div>
          <div>
            <div
              style={{
                fontSize: '1rem',
                fontWeight: 700,
                color: '#ffffff',
                letterSpacing: '-0.02em',
                lineHeight: 1.15,
              }}
            >
              AI Data Access & Policy Auditor
            </div>
            <div
              style={{
                fontSize: '0.7rem',
                color: 'var(--text-muted)',
                fontWeight: 500,
              }}
            >
              Deterministic Governance & Audit Verifier
            </div>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav
          style={{
            display: 'none',
            alignItems: 'center',
            gap: '4px',
          }}
          className="desktop-nav"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  fontWeight: active ? 600 : 500,
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: active
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'transparent',
                  borderRadius: 'var(--radius-sm)',
                  border: active
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid transparent',
                  transition: 'all 0.15s ease',
                }}
              >
                <Icon size={15} color={active ? '#818cf8' : '#94a3b8'} />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Auth / Mode Status Pill */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
          }}
        >
          {isAuthenticated ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div
                style={{
                  display: 'none',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                }}
                className="user-info-text"
              >
                <span
                  style={{
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    color: '#ffffff',
                  }}
                >
                  {user?.email}
                </span>
                <span
                  style={{
                    fontSize: '0.7rem',
                    color: '#10b981',
                    fontWeight: 500,
                  }}
                >
                  {user?.role} Access
                </span>
              </div>
              <button
                onClick={logout}
                className="btn btn-secondary btn-sm"
                title="Sign Out"
                id="btn-signout"
              >
                <LogOut size={14} />
                <span className="btn-label-desktop">Sign Out</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              {isPublicMode && (
                <span
                  className="badge badge-simulation"
                  style={{ fontSize: '0.7rem' }}
                >
                  Public Viewer Mode
                </span>
              )}
              <Link
                href="/login"
                className="btn btn-primary btn-sm"
                id="btn-nav-signin"
              >
                <LogIn size={14} />
                <span>Sign In</span>
              </Link>
            </div>
          )}

          {/* Mobile hamburger button */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="mobile-toggle-btn"
            aria-label="Toggle navigation"
            style={{
              background: 'transparent',
              border: 'none',
              color: 'var(--text-primary)',
              cursor: 'pointer',
              display: 'flex',
              padding: '6px',
            }}
          >
            {mobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderBottom: '1px solid var(--border-card)',
            padding: '16px 24px 24px',
            display: 'flex',
            flexDirection: 'column',
            gap: '8px',
          }}
          className="mobile-drawer"
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px',
                  padding: '12px 14px',
                  borderRadius: 'var(--radius-md)',
                  color: active ? '#ffffff' : 'var(--text-secondary)',
                  backgroundColor: active
                    ? 'rgba(99, 102, 241, 0.15)'
                    : 'transparent',
                  border: active
                    ? '1px solid rgba(99, 102, 241, 0.3)'
                    : '1px solid transparent',
                  fontSize: '0.92rem',
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon size={18} color={active ? '#818cf8' : '#94a3b8'} />
                {item.label}
              </Link>
            );
          })}
        </div>
      )}
    </header>
  );
}
