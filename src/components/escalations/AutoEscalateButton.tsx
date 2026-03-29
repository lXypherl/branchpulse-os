'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function AutoEscalateButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  const handleClick = async () => {
    setLoading(true);
    setResult(null);

    try {
      const res = await fetch('/api/escalations/auto', { method: 'POST' });
      const data = await res.json();

      if (!res.ok) {
        setResult(data.error || 'Auto-escalation failed');
        return;
      }

      if (data.escalated === 0) {
        setResult('No issues need escalation');
      } else {
        setResult(`${data.escalated} issue${data.escalated === 1 ? '' : 's'} auto-escalated`);
      }

      router.refresh();
    } catch {
      setResult('Network error - could not reach server');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={handleClick}
        disabled={loading}
        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-60 disabled:pointer-events-none text-sm"
      >
        <span className={`material-symbols-outlined text-[18px] ${loading ? 'animate-spin' : ''}`}>
          {loading ? 'progress_activity' : 'autorenew'}
        </span>
        {loading ? 'Running...' : 'Run Auto-Escalation Check'}
      </button>

      {result && (
        <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1.5 rounded-full">
          {result}
        </span>
      )}
    </div>
  );
}
