'use client';

import { useEffect, useState } from 'react';

interface MonthData {
  month: string;
  avgScore: number;
  issueCount: number;
  resolutionRate: number;
  auditCount: number;
}

export default function ComplianceTrendChart() {
  const [months, setMonths] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics/trends')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load trends');
        return res.json();
      })
      .then((data) => {
        setMonths(data.months ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-sm text-on-surface-variant">Loading trend data...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>error</span>
        Unable to load compliance trends
      </div>
    );
  }

  if (months.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="material-symbols-outlined text-on-surface-variant/40 mb-2" style={{ fontSize: 36 }}>bar_chart</span>
        <p className="text-sm text-on-surface-variant">No trend data available yet</p>
      </div>
    );
  }

  const maxScore = 100;
  const maxIssues = Math.max(...months.map((m) => m.issueCount), 1);

  // Trend arrow: compare latest month to previous
  const latest = months[months.length - 1];
  const previous = months.length >= 2 ? months[months.length - 2] : null;
  const scoreTrend = previous ? latest.avgScore - previous.avgScore : 0;

  return (
    <div>
      {/* Legend + Trend */}
      <div className="mb-5 flex items-center justify-between">
        <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
            Compliance Score
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-2.5 w-2.5 rounded-sm bg-tertiary/60" />
            Issue Count
          </span>
        </div>
        {previous && (
          <div className="flex items-center gap-1">
            <span
              className={`material-symbols-outlined ${scoreTrend >= 0 ? 'text-secondary' : 'text-tertiary'}`}
              style={{ fontSize: 18 }}
            >
              {scoreTrend >= 0 ? 'trending_up' : 'trending_down'}
            </span>
            <span
              className={`text-xs font-bold ${scoreTrend >= 0 ? 'text-secondary' : 'text-tertiary'}`}
            >
              {scoreTrend >= 0 ? '+' : ''}
              {Math.round(scoreTrend * 10) / 10}%
            </span>
          </div>
        )}
      </div>

      {/* Bar Chart */}
      <div className="flex items-end gap-4">
        {months.map((m) => (
          <div key={m.month} className="flex flex-1 flex-col items-center gap-2">
            <div
              className="flex w-full items-end justify-center gap-1.5"
              style={{ height: 180 }}
            >
              {/* Compliance score bar */}
              <div className="relative w-8 overflow-hidden rounded-t-lg bg-primary/10">
                <div
                  className="absolute bottom-0 w-full rounded-t-lg bg-primary transition-all duration-500"
                  style={{ height: `${(m.avgScore / maxScore) * 100}%` }}
                />
                <div style={{ height: `${(m.avgScore / maxScore) * 100}%` }} />
              </div>
              {/* Issue count bar */}
              <div className="relative w-8 overflow-hidden rounded-t-lg bg-tertiary/10">
                <div
                  className="absolute bottom-0 w-full rounded-t-lg bg-tertiary/60 transition-all duration-500"
                  style={{ height: `${(m.issueCount / maxIssues) * 100}%` }}
                />
                <div
                  style={{
                    height: `${Math.max((m.issueCount / maxIssues) * 100, 2)}%`,
                  }}
                />
              </div>
            </div>
            <span className="text-[11px] font-medium text-on-surface-variant">
              {m.month.split(' ')[0]}
            </span>
            <span className="text-[10px] text-on-surface-variant/70">
              {m.avgScore > 0 ? `${m.avgScore}%` : '--'}
            </span>
          </div>
        ))}
      </div>

      {/* Summary row */}
      <div className="mt-5 grid grid-cols-3 gap-4 rounded-lg bg-surface-container-low p-3">
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Avg Score
          </p>
          <p className="text-lg font-bold text-on-surface">
            {latest.avgScore > 0 ? `${latest.avgScore}%` : '--'}
          </p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Issues
          </p>
          <p className="text-lg font-bold text-on-surface">{latest.issueCount}</p>
        </div>
        <div className="text-center">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Resolution
          </p>
          <p className="text-lg font-bold text-on-surface">
            {latest.resolutionRate > 0 ? `${latest.resolutionRate}%` : '--'}
          </p>
        </div>
      </div>
    </div>
  );
}
