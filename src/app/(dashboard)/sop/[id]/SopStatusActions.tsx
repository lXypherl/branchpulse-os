'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

interface Props {
  sopId: string;
  currentStatus: string;
}

export default function SopStatusActions({ sopId, currentStatus }: Props) {
  const router = useRouter();
  const [updating, setUpdating] = useState<string | null>(null);

  async function updateStatus(newStatus: string) {
    setUpdating(newStatus);
    try {
      const res = await fetch(`/api/sop/${sopId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!res.ok) {
        const data = await res.json();
        alert(data.error || 'Failed to update status');
        return;
      }

      router.refresh();
    } catch {
      alert('Failed to update status');
    } finally {
      setUpdating(null);
    }
  }

  const actions = [
    {
      status: 'CURRENT',
      label: 'Mark as Current',
      icon: 'check_circle',
      color: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-emerald-200',
      show: currentStatus !== 'CURRENT',
    },
    {
      status: 'UNDER_REVIEW',
      label: 'Mark as Under Review',
      icon: 'pending',
      color: 'bg-amber-50 text-amber-700 hover:bg-amber-100 border-amber-200',
      show: currentStatus !== 'UNDER_REVIEW',
    },
    {
      status: 'ARCHIVED',
      label: 'Archive',
      icon: 'archive',
      color: 'bg-slate-50 text-slate-600 hover:bg-slate-100 border-slate-200',
      show: currentStatus !== 'ARCHIVED',
    },
  ];

  return (
    <div className="space-y-2">
      {actions
        .filter((a) => a.show)
        .map((a) => (
          <button
            key={a.status}
            onClick={() => updateStatus(a.status)}
            disabled={updating !== null}
            className={`w-full inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${a.color}`}
          >
            <span className="material-symbols-outlined text-[18px]">
              {updating === a.status ? 'progress_activity' : a.icon}
            </span>
            {a.label}
          </button>
        ))}
    </div>
  );
}
