'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import Link from 'next/link';

type AuditStatus = 'DRAFT' | 'SUBMITTED' | 'UNDER_REVIEW' | 'APPROVED' | 'RETURNED' | 'CLOSED';

interface AuditActionsProps {
  auditId: string;
  currentStatus: string;
}

const TRANSITIONS: Record<AuditStatus, { label: string; target: AuditStatus; icon: string; style: 'primary' | 'green' | 'outline' }[]> = {
  DRAFT: [
    { label: 'Submit for Review', target: 'SUBMITTED', icon: 'send', style: 'primary' },
  ],
  SUBMITTED: [
    { label: 'Begin Review', target: 'UNDER_REVIEW', icon: 'rate_review', style: 'primary' },
  ],
  UNDER_REVIEW: [
    { label: 'Approve Audit', target: 'APPROVED', icon: 'check_circle', style: 'green' },
    { label: 'Return for Revision', target: 'RETURNED', icon: 'undo', style: 'outline' },
  ],
  RETURNED: [
    { label: 'Resubmit', target: 'SUBMITTED', icon: 'send', style: 'primary' },
  ],
  APPROVED: [
    { label: 'Close Audit', target: 'CLOSED', icon: 'lock', style: 'primary' },
  ],
  CLOSED: [],
};

const BTN_STYLES: Record<string, string> = {
  primary:
    'bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white shadow-md hover:shadow-lg transition-shadow',
  green:
    'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md hover:shadow-lg transition-shadow',
  outline:
    'bg-white text-on-background border border-outline-variant/40 hover:bg-surface-container-low transition-colors',
};

export default function AuditActions({ auditId, currentStatus }: AuditActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = currentStatus as AuditStatus;
  const actions = TRANSITIONS[status] ?? [];

  async function handleTransition(targetStatus: AuditStatus) {
    setLoading(targetStatus);
    setError(null);

    try {
      const res = await fetch(`/api/audits/${auditId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to update audit status');
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
        Actions
      </h2>

      {status === 'CLOSED' ? (
        <p className="text-xs text-on-surface-variant text-center py-2">
          Audit Closed
        </p>
      ) : actions.length === 0 ? (
        <p className="text-xs text-on-surface-variant text-center py-2">
          No actions available for this audit status.
        </p>
      ) : (
        actions.map((action) => (
          <button
            key={action.target}
            disabled={loading !== null}
            onClick={() => handleTransition(action.target)}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES[action.style]}`}
          >
            {loading === action.target ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">{action.icon}</span>
            )}
            {action.label}
          </button>
        ))
      )}

      {error && (
        <p className="text-xs text-tertiary text-center mt-2">{error}</p>
      )}

      {/* Create Issue from Audit link */}
      {status !== 'CLOSED' && (
        <Link
          href={`/issues?createFrom=${auditId}`}
          className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold bg-white text-on-background border border-outline-variant/40 hover:bg-surface-container-low transition-colors mt-1"
        >
          <span className="material-symbols-outlined text-[16px]">add_circle</span>
          Create Issue from Audit
        </Link>
      )}
    </div>
  );
}
