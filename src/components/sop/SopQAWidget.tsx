'use client';

import { useState } from 'react';
import Link from 'next/link';

interface SopSource {
  id: string;
  title: string;
  version: string;
  category: string;
}

interface QAResponse {
  answer: string;
  sources: SopSource[];
  source: 'ai' | 'text-search' | 'none';
}

export default function SopQAWidget() {
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<QAResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function handleAsk(e: React.FormEvent) {
    e.preventDefault();
    if (!question.trim()) return;

    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch('/api/sop/qa', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question: question.trim() }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to get answer');
        return;
      }

      const data: QAResponse = await res.json();
      setResult(data);
    } catch {
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden mb-10">
      <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary rounded-full blur-[60px] opacity-20" />
      <div className="relative z-10">
        <div className="flex flex-col md:flex-row items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">
                  auto_awesome
                </span>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary-fixed-dim">
                SOP AI Assistant
              </span>
            </div>
            <p className="text-lg font-medium text-slate-300">
              Ask questions about any SOP document. Answers are grounded exclusively on governed
              source content.
            </p>
          </div>
          <div className="flex-1 w-full">
            <form onSubmit={handleAsk}>
              <div className="bg-white/10 rounded-xl border border-white/10 p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input
                  type="text"
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  placeholder="Ask a question about SOPs..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={loading || !question.trim()}
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <span className="inline-flex items-center gap-1.5">
                      <span className="material-symbols-outlined text-[14px] animate-spin">progress_activity</span>
                      Thinking...
                    </span>
                  ) : (
                    'Ask'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Answer Display */}
        {error && (
          <div className="mt-6 bg-red-500/10 border border-red-500/20 rounded-xl p-4">
            <p className="text-sm text-red-300">{error}</p>
          </div>
        )}

        {result && (
          <div className="mt-6 space-y-4">
            {/* Answer Card */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold uppercase tracking-widest text-indigo-300">
                  Answer
                </span>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wide ${
                  result.source === 'ai'
                    ? 'bg-indigo-500/20 text-indigo-300'
                    : result.source === 'text-search'
                    ? 'bg-amber-500/20 text-amber-300'
                    : 'bg-slate-500/20 text-slate-400'
                }`}>
                  <span className="material-symbols-outlined text-[12px]">
                    {result.source === 'ai' ? 'auto_awesome' : result.source === 'text-search' ? 'search' : 'info'}
                  </span>
                  {result.source === 'ai' ? 'Powered by AI' : result.source === 'text-search' ? 'Powered by Text Search' : 'No Data'}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                {result.answer}
              </p>
            </div>

            {/* Source Citations */}
            {result.sources.length > 0 && (
              <div>
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400 mb-2 block">
                  Sources ({result.sources.length})
                </span>
                <div className="flex flex-wrap gap-2">
                  {result.sources.map((source) => (
                    <Link
                      key={source.id}
                      href={`/sop/${source.id}`}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/5 border border-white/10 rounded-lg text-xs text-slate-300 hover:bg-white/10 hover:text-white transition-colors"
                    >
                      <span className="material-symbols-outlined text-[14px]">description</span>
                      {source.title}
                      <span className="text-slate-500">v{source.version}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
