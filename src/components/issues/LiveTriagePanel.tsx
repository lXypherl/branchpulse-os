'use client';

import { useState, useEffect } from 'react';

interface TriageResult {
  severity: { value: string; confidence: number };
  category: { value: string; confidence: number };
  suggestedRole: { value: string; confidence: number };
  source: 'ai' | 'rules';
}

const ROLE_LABELS: Record<string, string> = {
  BRANCH_MANAGER: 'Branch Manager',
  AREA_MANAGER: 'Area Manager',
  REGIONAL_MANAGER: 'Regional Manager',
  HQ_DIRECTOR: 'HQ Director',
};

export default function LiveTriagePanel({ issueId, title, description, currentSeverity, currentCategory }: {
  issueId: string;
  title: string;
  description: string;
  currentSeverity: string;
  currentCategory: string;
}) {
  const [triage, setTriage] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [applying, setApplying] = useState(false);
  const [applied, setApplied] = useState(false);

  useEffect(() => {
    if (!title || title.length < 5) { setLoading(false); return; }

    fetch('/api/issues/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
      .then(r => r.json())
      .then(data => { setTriage(data); setLoading(false); })
      .catch(() => setLoading(false));
  }, [title, description]);

  const handleApply = async () => {
    if (!triage) return;
    setApplying(true);
    try {
      const res = await fetch(`/api/issues/${issueId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          severity: triage.severity.value,
          category: triage.category.value,
        }),
      });
      if (res.ok) {
        setApplied(true);
        // Reload to show updated data
        window.location.reload();
      }
    } catch { /* ignore */ }
    setApplying(false);
  };

  return (
    <div className="relative overflow-hidden rounded-[32px] bg-gradient-to-br from-indigo-950 to-slate-900 p-6 text-white">
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-indigo-500/20 blur-3xl" />
      <div className="relative z-10">
        <div className="mb-4 flex items-center gap-2">
          <span className="material-symbols-outlined filled-icon text-[20px] text-indigo-300">auto_awesome</span>
          <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">AI Triage Assistant</span>
          {triage && (
            <span className={`ml-auto rounded px-2 py-0.5 text-[10px] font-bold uppercase ${
              triage.source === 'ai' ? 'bg-indigo-500/30 text-indigo-200' : 'bg-slate-500/30 text-slate-300'
            }`}>
              {triage.source === 'ai' ? 'AI Powered' : 'Rule-Based'}
            </span>
          )}
        </div>

        {loading ? (
          <div className="flex items-center gap-2 py-4">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
            <span className="text-sm text-indigo-200">Analyzing issue...</span>
          </div>
        ) : triage ? (
          <>
            <p className="mb-4 text-sm leading-relaxed text-indigo-100/90">
              Analysis of &ldquo;{title.substring(0, 60)}{title.length > 60 ? '...' : ''}&rdquo;
            </p>

            {/* Severity */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Suggested Severity</span>
                <span className="text-sm font-bold">{triage.severity.value}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-red-400" style={{ width: `${triage.severity.confidence}%` }} />
              </div>
              <span className="text-[10px] text-indigo-400">{triage.severity.confidence}% confidence</span>
            </div>

            {/* Category */}
            <div className="mb-3">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Suggested Category</span>
                <span className="text-sm font-bold">{triage.category.value}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-blue-400" style={{ width: `${triage.category.confidence}%` }} />
              </div>
              <span className="text-[10px] text-indigo-400">{triage.category.confidence}% confidence</span>
            </div>

            {/* Suggested Owner */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-indigo-400">Suggested Owner</span>
                <span className="text-sm font-bold">{ROLE_LABELS[triage.suggestedRole.value] || triage.suggestedRole.value}</span>
              </div>
              <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                <div className="h-full rounded-full bg-green-400" style={{ width: `${triage.suggestedRole.confidence}%` }} />
              </div>
              <span className="text-[10px] text-indigo-400">{triage.suggestedRole.confidence}% confidence</span>
            </div>

            {applied ? (
              <div className="mt-4 w-full rounded-xl bg-green-500/20 py-2.5 text-center text-sm font-bold text-green-300">
                Suggestions Applied
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={applying}
                className="mt-2 w-full rounded-xl bg-white py-2.5 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50 disabled:opacity-50"
              >
                {applying ? 'Applying...' : 'Apply Suggestions'}
              </button>
            )}
          </>
        ) : (
          <p className="text-sm text-indigo-300">Unable to analyze this issue.</p>
        )}
      </div>
    </div>
  );
}
