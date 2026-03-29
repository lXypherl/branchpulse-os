'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
}

const roleOrder = [
  'HQ_DIRECTOR',
  'FRANCHISE_MANAGER',
  'REGIONAL_MANAGER',
  'AREA_MANAGER',
  'BRANCH_MANAGER',
  'FIELD_AUDITOR',
  'EXECUTIVE_VIEWER',
];

const roleLabels: Record<string, string> = {
  HQ_DIRECTOR: 'HQ Operations Director',
  FRANCHISE_MANAGER: 'Franchise Operations Manager',
  REGIONAL_MANAGER: 'Regional Manager',
  AREA_MANAGER: 'Area Manager',
  BRANCH_MANAGER: 'Branch Manager',
  FIELD_AUDITOR: 'Field Auditor',
  EXECUTIVE_VIEWER: 'Executive Viewer',
};

const roleSublabels: Record<string, string> = {
  HQ_DIRECTOR: 'Global Command',
  FRANCHISE_MANAGER: 'Network Operations',
  REGIONAL_MANAGER: 'Regional Control',
  AREA_MANAGER: 'Area Operations',
  BRANCH_MANAGER: 'Branch Operations',
  FIELD_AUDITOR: 'Field Operations',
  EXECUTIVE_VIEWER: 'Executive Access',
};

const roleColors: Record<string, { bg: string; text: string; border: string; icon: string }> = {
  HQ_DIRECTOR: {
    bg: 'bg-blue-50',
    text: 'text-blue-700',
    border: 'border-blue-200',
    icon: 'domain',
  },
  FRANCHISE_MANAGER: {
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
    border: 'border-emerald-200',
    icon: 'hub',
  },
  REGIONAL_MANAGER: {
    bg: 'bg-violet-50',
    text: 'text-violet-700',
    border: 'border-violet-200',
    icon: 'map',
  },
  AREA_MANAGER: {
    bg: 'bg-amber-50',
    text: 'text-amber-700',
    border: 'border-amber-200',
    icon: 'location_city',
  },
  BRANCH_MANAGER: {
    bg: 'bg-cyan-50',
    text: 'text-cyan-700',
    border: 'border-cyan-200',
    icon: 'store',
  },
  FIELD_AUDITOR: {
    bg: 'bg-orange-50',
    text: 'text-orange-700',
    border: 'border-orange-200',
    icon: 'fact_check',
  },
  EXECUTIVE_VIEWER: {
    bg: 'bg-slate-50',
    text: 'text-slate-700',
    border: 'border-slate-200',
    icon: 'visibility',
  },
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export default function LoginPage() {
  const router = useRouter();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingIn, setLoggingIn] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/auth/users')
      .then((res) => res.json())
      .then((data) => {
        setUsers(data.users || []);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users. Please try again.');
        setLoading(false);
      });
  }, []);

  const handleLogin = async (userId: string) => {
    setLoggingIn(userId);
    setError(null);

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Login failed');
      }

      router.push('/');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed');
      setLoggingIn(null);
    }
  };

  // Group users by role in the defined order
  const groupedUsers = roleOrder.reduce<Record<string, User[]>>((acc, role) => {
    const roleUsers = users.filter((u) => u.role === role);
    if (roleUsers.length > 0) {
      acc[role] = roleUsers;
    }
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-background">
      {/* Subtle background pattern */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary/[0.03] blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-secondary/[0.03] blur-3xl" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-6 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          {/* Logo */}
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-primary flex items-center justify-center shadow-lg shadow-primary/25">
              <span className="material-symbols-outlined text-white text-xl filled-icon">
                pulse_alert
              </span>
            </div>
            <span className="text-2xl font-black tracking-tighter text-on-surface">
              BranchPulse OS
            </span>
          </div>

          <h1 className="text-3xl font-bold text-on-surface mb-3 tracking-tight">
            Welcome back
          </h1>
          <p className="text-on-surface-variant text-base max-w-md mx-auto">
            Select your role to continue to the operations dashboard
          </p>
        </div>

        {/* Error message */}
        {error && (
          <div className="max-w-lg mx-auto mb-8 px-4 py-3 rounded-xl bg-error-container text-on-error-container text-sm font-medium flex items-center gap-2">
            <span className="material-symbols-outlined text-lg">error</span>
            {error}
          </div>
        )}

        {/* Loading state */}
        {loading && (
          <div className="flex flex-col items-center justify-center py-24 gap-4">
            <div className="w-8 h-8 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
            <p className="text-sm text-on-surface-variant">Loading users...</p>
          </div>
        )}

        {/* User groups */}
        {!loading && Object.keys(groupedUsers).length === 0 && !error && (
          <div className="text-center py-24">
            <span className="material-symbols-outlined text-5xl text-outline-variant mb-4 block">
              group_off
            </span>
            <p className="text-on-surface-variant">
              No users found. Please seed the database first.
            </p>
          </div>
        )}

        {!loading && (
          <div className="space-y-10">
            {Object.entries(groupedUsers).map(([role, roleUsers]) => {
              const colors = roleColors[role] || roleColors.EXECUTIVE_VIEWER;
              return (
                <section key={role}>
                  {/* Role section header */}
                  <div className="flex items-center gap-3 mb-4">
                    <div
                      className={`w-8 h-8 rounded-lg ${colors.bg} ${colors.text} flex items-center justify-center`}
                    >
                      <span className="material-symbols-outlined text-lg">
                        {colors.icon}
                      </span>
                    </div>
                    <div>
                      <h2 className="text-sm font-semibold text-on-surface leading-tight">
                        {roleLabels[role] || role}
                      </h2>
                      <p className="text-xs text-on-surface-variant leading-tight">
                        {roleSublabels[role] || 'System Access'}
                      </p>
                    </div>
                  </div>

                  {/* User cards grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                    {roleUsers.map((user) => {
                      const isLoggingIn = loggingIn === user.id;
                      const isDisabled = loggingIn !== null;

                      return (
                        <button
                          key={user.id}
                          onClick={() => handleLogin(user.id)}
                          disabled={isDisabled}
                          className={`
                            group relative text-left w-full
                            bg-surface-container-lowest rounded-2xl
                            border border-outline-variant/15
                            shadow-ambient
                            px-5 py-4
                            transition-all duration-200 ease-out
                            ${
                              isLoggingIn
                                ? 'border-primary ring-2 ring-primary/20 scale-[1.02]'
                                : isDisabled
                                  ? 'opacity-50 cursor-not-allowed'
                                  : 'hover:scale-[1.02] hover:shadow-ambient-lg hover:border-outline-variant/30 cursor-pointer'
                            }
                          `}
                        >
                          <div className="flex items-center gap-4">
                            {/* Avatar with initials */}
                            <div
                              className={`
                                flex-shrink-0 w-10 h-10 rounded-full flex items-center justify-center
                                text-sm font-semibold transition-colors duration-200
                                ${
                                  isLoggingIn
                                    ? 'bg-primary text-on-primary'
                                    : `${colors.bg} ${colors.text} group-hover:bg-primary/10 group-hover:text-primary`
                                }
                              `}
                            >
                              {isLoggingIn ? (
                                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                              ) : (
                                getInitials(user.name)
                              )}
                            </div>

                            {/* User info */}
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-on-surface truncate leading-tight">
                                {user.name}
                              </p>
                              <p className="text-xs text-on-surface-variant truncate mt-0.5">
                                {user.email}
                              </p>
                            </div>

                            {/* Arrow indicator */}
                            <span
                              className={`
                                material-symbols-outlined text-lg flex-shrink-0
                                transition-all duration-200
                                ${
                                  isLoggingIn
                                    ? 'text-primary'
                                    : 'text-outline-variant group-hover:text-primary group-hover:translate-x-0.5'
                                }
                              `}
                            >
                              arrow_forward
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        )}

        {/* Footer */}
        <div className="mt-16 text-center">
          <p className="text-xs text-outline">
            BranchPulse OS &middot; Franchise Operations Platform
          </p>
        </div>
      </div>
    </div>
  );
}
