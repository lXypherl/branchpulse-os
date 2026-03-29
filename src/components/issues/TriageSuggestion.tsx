'use client';

import { useState, useEffect, useRef } from 'react';

interface TriageResult {
  severity: { value: string; confidence: number };
  category: { value: string; confidence: number };
  suggestedRole: { value: string; confidence: number };
  source: 'ai' | 'rules';
}

interface TriageSuggestionProps {
  title: string;
  description: string;
  onApply?: (result: TriageResult) => void;
}

const ROLE_LABELS: Record<string, string> = {
  BRANCH_MANAGER: 'Branch Manager',
  AREA_MANAGER: 'Area Manager',
  REGIONAL_MANAGER: 'Regional Manager',
};

function confidenceColor(confidence: number): string {
  if (confidence >= 80) return 'bg-emerald-500/20 text-emerald-400';
  if (confidence >= 60) return 'bg-amber-500/20 text-amber-400';
  return 'bg-slate-500/20 text-slate-400';
}

function severityColor(severity: string): string {
  switch (severity) {
    case 'CRITICAL': return 'bg-red-500/20 text-red-400 border-red-500/30';
    case 'HIGH': return 'bg-orange-500/20 text-orange-400 border-orange-500/30';
    case 'MEDIUM': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
    case 'LOW': return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
    default: return 'bg-slate-500/20 text-slate-400 border-slate-500/30';
  }
}

export default function TriageSuggestion({ title, description, onApply }: TriageSuggestionProps) {
  const [result, setResult] = useState<TriageResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous result when input changes significantly
    if (title.length < 10) {
      setResult(null);
      setError(null);
      return;
    }

    // Debounce the API call
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      setError(null);

      try {
        const res = await fetch('/api/issues/triage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ title, description }),
        });

        if (!res.ok) {
          setError('Failed to get suggestions');
          return;
        }

        const data: TriageResult = await res.json();
        setResult(data);
      } catch {
        setError('Could not reach triage service');
      } finally {
        setLoading(false);
      }
    }, 500);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [title, description]);

  if (!result && !loading && !error) return null;

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-950 to-slate-900 p-5 text-white">
      {/* Glow effect */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined filled-icon text-[18px] text-indigo-300">
              auto_awesome
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-300">
              AI Triage Suggestions
            </span>
          </div>
          {result && (
            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide ${
              result.source === 'ai' ? 'bg-indigo-500/20 text-indigo-300' : 'bg-slate-500/20 text-slate-400'
            }`}>
              {result.source === 'ai' ? 'AI' : 'Rules'}
            </span>
          )}
        </div>

        {/* Loading */}
        {loading && (
          <div className="flex items-center gap-2 py-3">
            <span className="material-symbols-outlined text-[16px] text-indigo-300 animate-spin">progress_activity</span>
            <span className="text-xs text-indigo-200">Analyzing issue...</span>
          </div>
        )}

        {/* Error */}
        {error && !loading && (
          <p className="text-xs text-red-300 py-2">{error}</p>
        )}

        {/* Results */}
        {result && !loading && (
          <div className="space-y-3">
            {/* Severity */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 w-20">
                  Severity
                </span>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-md text-[11px] font-bold uppercase tracking-wide border ${severityColor(result.severity.value)}`}>
                  {result.severity.value}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceColor(result.severity.confidence)}`}>
                {result.severity.confidence}%
              </span>
            </div>

            {/* Category */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 w-20">
                  Category
                </span>
                <span className="text-xs font-medium text-slate-200">
                  {result.category.value}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceColor(result.category.confidence)}`}>
                {result.category.confidence}%
              </span>
            </div>

            {/* Suggested Role */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold uppercase tracking-wider text-indigo-400 w-20">
                  Assign To
                </span>
                <span className="text-xs font-medium text-slate-200">
                  {ROLE_LABELS[result.suggestedRole.value] || result.suggestedRole.value}
                </span>
              </div>
              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold ${confidenceColor(result.suggestedRole.confidence)}`}>
                {result.suggestedRole.confidence}%
              </span>
            </div>

            {/* Apply Button */}
            {onApply && (
              <button
                onClick={() => onApply(result)}
                className="mt-2 w-full rounded-xl bg-white py-2 text-sm font-bold text-indigo-950 transition hover:bg-indigo-50"
              >
                Apply Suggestions
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
