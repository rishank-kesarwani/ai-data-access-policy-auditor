import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: 'AI Data Access & Policy Auditor',
  description:
    'Auditable policy evaluation for AI workflow data access, with explicit authorization rules, explainable allow/deny/escalate decisions, and privacy-focused cryptographic access records.',
  keywords: [
    'AI Policy Auditor',
    'Data Access Governance',
    'AI Authorization Engine',
    'Audit Hash Chain',
    'AI Security',
  ],
  authors: [{ name: 'Rishank Kesarwani' }],
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              minHeight: '100vh',
            }}
          >
            <Navbar />
            <main style={{ flex: 1, padding: '32px 0' }}>{children}</main>
            <Footer />
          </div>
        </AuthProvider>
      </body>
    </html>
  );
}
