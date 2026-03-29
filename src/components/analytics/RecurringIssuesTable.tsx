'use client';

import { useEffect, useState } from 'react';

interface RecurringPattern {
  category: string;
  branchName: string;
  count: number;
  severity: string;
  firstSeen: string;
  lastSeen: string;
  type: 'recurring' | 'systemic';
}

const SEVERITY_BADGE: Record<string, string> = {
  CRITICAL: 'bg-tertiary/10 text-tertiary',
  HIGH: 'bg-[#ea580c]/10 text-[#ea580c]',
  MEDIUM: 'bg-[#f59e0b]/10 text-[#d97706]',
  LOW: 'bg-primary/10 text-primary',
};

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export default function RecurringIssuesTable() {
  const [patterns, setPatterns] = useState<RecurringPattern[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics/recurring-issues')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load recurring issues');
        return res.json();
      })
      .then((data) => {
        setPatterns(data.recurring ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-sm text-on-surface-variant">Analyzing issue patterns...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>error</span>
        Unable to load recurring issue data
      </div>
    );
  }

  if (patterns.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="material-symbols-outlined text-secondary/40 mb-2" style={{ fontSize: 36 }}>check_circle</span>
        <p className="text-sm font-medium text-on-surface">No Recurring Patterns</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          No recurring or systemic issue patterns detected in the last 90 days
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-sm">
        <thead>
          <tr className="border-b border-outline-variant/20">
            <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Type
            </th>
            <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Category
            </th>
            <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Branch(es)
            </th>
            <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Count
            </th>
            <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Severity
            </th>
            <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              First / Last Seen
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-outline-variant/10">
          {patterns.map((p, i) => (
            <tr key={`${p.category}-${p.branchName}-${i}`} className="group">
              <td className="py-3.5">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    p.type === 'systemic'
                      ? 'bg-tertiary/10 text-tertiary'
                      : 'bg-primary/10 text-primary'
                  }`}
                >
                  {p.type === 'systemic' ? 'Systemic' : 'Recurring'}
                </span>
              </td>
              <td className="py-3.5 text-sm font-medium text-on-surface">
                {p.category}
              </td>
              <td className="py-3.5 text-xs text-on-surface-variant">
                {p.branchName}
              </td>
              <td className="py-3.5">
                <span className="inline-flex h-6 min-w-[1.5rem] items-center justify-center rounded-md bg-surface-container-high px-1.5 text-xs font-bold text-on-surface">
                  {p.count}
                </span>
              </td>
              <td className="py-3.5">
                <span
                  className={`inline-block rounded-full px-2.5 py-1 text-[10px] font-bold ${
                    SEVERITY_BADGE[p.severity] ?? SEVERITY_BADGE.MEDIUM
                  }`}
                >
                  {p.severity}
                </span>
              </td>
              <td className="py-3.5 text-xs text-on-surface-variant">
                {formatDate(p.firstSeen)} &mdash; {formatDate(p.lastSeen)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
