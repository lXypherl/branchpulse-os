'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

const DEMO_ACCOUNTS = [
  { email: 'sandra.chen@xyloquent.com', role: 'HQ Director', label: 'Global Command' },
  { email: 'marcus.williams@xyloquent.com', role: 'Franchise Manager', label: 'Network Operations' },
  { email: 'david.park@xyloquent.com', role: 'Regional Manager', label: 'North Region' },
  { email: 'priya.sharma@xyloquent.com', role: 'Regional Manager', label: 'South Region' },
  { email: 'emma.torres@xyloquent.com', role: 'Area Manager', label: 'NYC Area' },
  { email: 'james.okonkwo@xyloquent.com', role: 'Area Manager', label: 'Boston Metro' },
  { email: 'carlos.rivera@xyloquent.com', role: 'Branch Manager', label: 'Downtown Flagship' },
  { email: 'leo.fernandez@xyloquent.com', role: 'Branch Manager', label: 'Times Square North' },
  { email: 'rachel.kim@xyloquent.com', role: 'Branch Manager', label: 'Lexington Ave' },
  { email: 'aisha.patel@xyloquent.com', role: 'Field Auditor', label: 'Field Operations' },
  { email: 'nathan.brooks@xyloquent.com', role: 'Field Auditor', label: 'Field Operations' },
  { email: 'olivia.grant@xyloquent.com', role: 'Executive Viewer', label: 'Executive Access' },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDemo, setShowDemo] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoading(false);
    }
  };

  const fillDemo = (demoEmail: string) => {
    setEmail(demoEmail);
    setPassword('password123');
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-md mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Parent brand */}
          {/* Logo */}
          <div className="inline-flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-white text-xl filled-icon">
                pulse_alert
              </span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-on-surface">
              Xyloquent Branch OS
            </span>
          </div>

          <p className="text-[11px] font-medium text-on-surface-variant/70 mb-8">
            Franchise Operations Platform
          </p>

          <h1 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">
            Welcome back
          </h1>
          <p className="text-on-surface-variant text-base max-w-md mx-auto">
            Sign in to access the operations dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Login form */}
        <form onSubmit={handleSubmit}>
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-ambient p-6 space-y-5">
            {/* Email field */}
            <div>
              <label
                htmlFor="email"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Email address
              </label>
              <input
                id="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@xyloquent.com"
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Password field */}
            <div>
              <label
                htmlFor="password"
                className="block text-sm font-medium text-on-surface mb-1.5"
              >
                Password
              </label>
              <input
                id="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                className="w-full px-4 py-2.5 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-outline-variant text-sm focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-colors"
              />
            </div>

            {/* Submit button */}
            <button
              type="submit"
              disabled={loading}
              className={`
                w-full py-2.5 px-4 rounded-xl text-sm font-semibold
                bg-gradient-to-r from-primary to-primary/90 text-on-primary
                shadow-lg shadow-primary/25
                transition-all duration-200 ease-out
                ${
                  loading
                    ? 'opacity-70 cursor-not-allowed'
                    : 'hover:shadow-xl hover:shadow-primary/30 hover:scale-[1.01] active:scale-[0.99]'
                }
              `}
            >
              {loading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Signing in...
                </span>
              ) : (
                'Sign in'
              )}
            </button>
          </div>
        </form>

        {/* Demo accounts collapsible */}
        <div className="mt-6">
          <button
            type="button"
            onClick={() => setShowDemo(!showDemo)}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-surface-container-lowest border border-outline-variant/15 text-sm text-on-surface-variant hover:bg-surface-container-low transition-colors"
          >
            <span className="flex items-center gap-2">
              <span className="material-symbols-outlined text-lg">group</span>
              Demo accounts
            </span>
            <span
              className={`material-symbols-outlined text-lg transition-transform duration-200 ${
                showDemo ? 'rotate-180' : ''
              }`}
            >
              expand_more
            </span>
          </button>

          {showDemo && (
            <div className="mt-2 bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-ambient overflow-hidden divide-y divide-outline-variant/10">
              {DEMO_ACCOUNTS.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => fillDemo(account.email)}
                  className="w-full text-left px-4 py-2.5 hover:bg-surface-container-low transition-colors"
                >
                  <p className="text-xs font-medium text-on-surface truncate">
                    {account.email}
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    {account.role} &middot; {account.label}
                  </p>
                </button>
              ))}
              <div className="px-4 py-2.5 bg-surface-container-low">
                <p className="text-xs text-outline">
                  All demo accounts use password: <span className="font-mono font-medium text-on-surface-variant">password123</span>
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-outline">
            Xyloquent Branch OS
          </p>
        </div>
      </div>
    </div>
  );
}
