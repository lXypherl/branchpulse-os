'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';

interface Anomaly {
  branchId: string;
  branchName: string;
  type: string;
  score: number;
  networkAvg: number;
  details: string;
}

const TYPE_CONFIG: Record<
  string,
  { label: string; badgeClass: string; icon: string; action: string }
> = {
  low_score: {
    label: 'Low Score',
    badgeClass: 'bg-tertiary/10 text-tertiary',
    icon: 'trending_down',
    action: 'Schedule compliance review and corrective audit',
  },
  no_recent_audit: {
    label: 'No Recent Audit',
    badgeClass: 'bg-[#f59e0b]/10 text-[#d97706]',
    icon: 'event_busy',
    action: 'Dispatch field auditor for immediate assessment',
  },
  score_decline: {
    label: 'Score Decline',
    badgeClass: 'bg-[#ea580c]/10 text-[#ea580c]',
    icon: 'arrow_downward',
    action: 'Investigate root cause and assign corrective actions',
  },
  critical_issues: {
    label: 'Critical Issues',
    badgeClass: 'bg-tertiary/10 text-tertiary',
    icon: 'report',
    action: 'Prioritize issue resolution and escalate if needed',
  },
};

export default function AnomalyList() {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/analytics/anomalies')
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load anomalies');
        return res.json();
      })
      .then((data) => {
        setAnomalies(data.anomalies ?? []);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        <span className="ml-3 text-sm text-on-surface-variant">Scanning for anomalies...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center gap-2 py-8 text-sm text-on-surface-variant">
        <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 18 }}>error</span>
        Unable to load anomaly data
      </div>
    );
  }

  if (anomalies.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-center">
        <span className="material-symbols-outlined text-secondary/40 mb-2" style={{ fontSize: 36 }}>verified</span>
        <p className="text-sm font-medium text-on-surface">All Clear</p>
        <p className="mt-1 text-xs text-on-surface-variant">
          No anomalies detected across the branch network
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {anomalies.map((anomaly, i) => {
        const config = TYPE_CONFIG[anomaly.type] ?? TYPE_CONFIG.low_score;
        return (
          <div
            key={`${anomaly.branchId}-${anomaly.type}-${i}`}
            className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-4 transition-shadow hover:shadow-ambient"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3 min-w-0">
                <span
                  className={`material-symbols-outlined mt-0.5 flex-shrink-0 ${
                    anomaly.type === 'low_score' || anomaly.type === 'critical_issues'
                      ? 'text-tertiary'
                      : anomaly.type === 'score_decline'
                        ? 'text-[#ea580c]'
                        : 'text-[#d97706]'
                  }`}
                  style={{ fontSize: 20 }}
                >
                  {config.icon}
                </span>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <Link
                      href="/branches"
                      className="text-sm font-semibold text-on-surface hover:text-primary transition-colors"
                    >
                      {anomaly.branchName}
                    </Link>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>
                  </div>
                  <p className="mt-1 text-xs text-on-surface-variant">
                    {anomaly.details}
                  </p>
                  <p className="mt-1.5 text-[10px] text-on-surface-variant/70">
                    <span className="material-symbols-outlined align-middle mr-0.5" style={{ fontSize: 12 }}>
                      lightbulb
                    </span>
                    {config.action}
                  </p>
                </div>
              </div>
              <div className="flex-shrink-0 text-right">
                <p className="text-lg font-black text-on-surface">{anomaly.score}%</p>
                <p className="text-[10px] text-on-surface-variant">
                  Avg: {anomaly.networkAvg}%
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
