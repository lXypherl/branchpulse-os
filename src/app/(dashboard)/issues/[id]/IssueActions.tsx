'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

type IssueStatus = 'OPEN' | 'IN_PROGRESS' | 'UNDER_REVIEW' | 'RESOLVED' | 'CLOSED';

interface IssueActionsProps {
  issueId: string;
  currentStatus: string;
  hasCorrectiveAction: boolean;
}

const BTN_STYLES = {
  primary:
    'bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white shadow-md hover:shadow-lg transition-shadow',
  green:
    'bg-gradient-to-br from-emerald-600 to-emerald-500 text-white shadow-md hover:shadow-lg transition-shadow',
  outline:
    'bg-white text-on-background border border-outline-variant/40 hover:bg-surface-container-low transition-colors',
};

export default function IssueActions({ issueId, currentStatus, hasCorrectiveAction }: IssueActionsProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const status = currentStatus as IssueStatus;

  async function handleTransition(targetStatus: IssueStatus) {
    setLoading(targetStatus);
    setError(null);

    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: targetStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? 'Failed to update issue status');
        return;
      }

      router.refresh();
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(null);
    }
  }

  function renderButtons() {
    switch (status) {
      case 'OPEN':
        return (
          <button
            disabled={loading !== null}
            onClick={() => handleTransition('IN_PROGRESS')}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES.primary}`}
          >
            {loading === 'IN_PROGRESS' ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">play_arrow</span>
            )}
            Mark In Progress
          </button>
        );

      case 'IN_PROGRESS':
        return (
          <button
            disabled={loading !== null}
            onClick={() => handleTransition('UNDER_REVIEW')}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES.primary}`}
          >
            {loading === 'UNDER_REVIEW' ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">send</span>
            )}
            Submit for Review
          </button>
        );

      case 'UNDER_REVIEW':
        return (
          <>
            <button
              disabled={loading !== null}
              onClick={() => handleTransition('RESOLVED')}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES.green}`}
            >
              {loading === 'RESOLVED' ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
              )}
              Mark Resolved
            </button>
            <button
              disabled={loading !== null}
              onClick={() => handleTransition('OPEN')}
              className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES.outline}`}
            >
              {loading === 'OPEN' ? (
                <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
              ) : (
                <span className="material-symbols-outlined text-[16px]">undo</span>
              )}
              Reopen
            </button>
          </>
        );

      case 'RESOLVED':
        return hasCorrectiveAction ? (
          <button
            disabled={loading !== null}
            onClick={() => handleTransition('CLOSED')}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold disabled:opacity-50 disabled:cursor-not-allowed ${BTN_STYLES.primary}`}
          >
            {loading === 'CLOSED' ? (
              <span className="material-symbols-outlined text-[16px] animate-spin">progress_activity</span>
            ) : (
              <span className="material-symbols-outlined text-[16px]">lock</span>
            )}
            Close Issue
          </button>
        ) : (
          <div className="space-y-2">
            <button
              disabled
              className="w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold opacity-50 cursor-not-allowed bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-white"
            >
              <span className="material-symbols-outlined text-[16px]">lock</span>
              Close Issue
            </button>
            <p className="flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 rounded-lg px-3 py-2">
              <span className="material-symbols-outlined text-[14px] mt-px flex-shrink-0">warning</span>
              Corrective action and evidence required before closing.
            </p>
          </div>
        );

      case 'CLOSED':
        return (
          <p className="text-xs text-on-surface-variant text-center py-2">
            Issue Closed
          </p>
        );

      default:
        return (
          <p className="text-xs text-on-surface-variant text-center py-2">
            No actions available for this issue status.
          </p>
        );
    }
  }

  return (
    <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6 space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-2">
        Actions
      </h2>

      {renderButtons()}

      {error && (
        <p className="text-xs text-tertiary text-center mt-2">{error}</p>
      )}
    </div>
  );
}
