import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import DashboardPage from '../app/page';
import { AuthProvider } from '../lib/auth-context';

jest.mock('../lib/api', () => ({
  api: {
    getHealth: jest.fn().mockResolvedValue({
      status: 'UP',
      features: { publicAccessEnabled: true },
      services: { persistence: 'IN_MEMORY' },
    }),
    getWorkflows: jest.fn().mockResolvedValue([
      { id: 'support-bot', name: 'Support Bot', riskTier: 'MEDIUM' },
    ]),
    getDataSources: jest.fn().mockResolvedValue([
      { id: 'customer-db', name: 'Customer DB', sensitivity: 'CONFIDENTIAL' },
    ]),
    getPolicies: jest.fn().mockResolvedValue([
      { id: 'pol-1', name: 'Baseline Policy', status: 'ACTIVE' },
    ]),
  },
}));

describe('Dashboard Page', () => {
  it('renders executive dashboard hero and launch controls', () => {
    render(
      <AuthProvider>
        <DashboardPage />
      </AuthProvider>,
    );

    expect(screen.getByText('AI Data Access & Policy Auditor')).toBeInTheDocument();
    expect(screen.getByText('Launch Decision Simulator')).toBeInTheDocument();
    expect(screen.getByText('Explore Demo Walkthrough')).toBeInTheDocument();
  });
});
