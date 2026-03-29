'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

const CATEGORIES = ['Safety', 'Operations', 'Inventory', 'Brand', 'Finance'];

export default function NewSOPPage() {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Safety');
  const [version, setVersion] = useState('1.0');
  const [description, setDescription] = useState('');
  const [content, setContent] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!title.trim()) { setError('Title is required.'); return; }
    if (!content.trim()) { setError('Content is required.'); return; }

    setSaving(true);
    try {
      const res = await fetch('/api/sop', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          category,
          version: version.trim() || '1.0',
          description: description.trim() || null,
          content: content.trim(),
          sections: content.split(/\n{2,}/).filter(Boolean).length || 1,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Failed to create SOP');
      }

      const sop = await res.json();
      router.push(`/sop/${sop.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create SOP');
      setSaving(false);
    }
  }

  return (
    <div className="max-w-[900px] mx-auto">
      {/* Header */}
      <header className="mb-10">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-4">
          <Link href="/sop" className="hover:text-primary transition-colors">
            SOP Library
          </Link>
          <span className="text-slate-300">&gt;</span>
          <span className="text-on-surface">New Document</span>
        </div>
        <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
          Create New SOP
        </h1>
        <p className="text-on-surface-variant font-medium">
          Author a new standard operating procedure document.
        </p>
      </header>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3">
            <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5">error</span>
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        {/* Title */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Document Title
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Food Safety & Hygiene Standards"
            className="w-full text-xl font-bold text-on-surface bg-transparent border-b-2 border-outline-variant/20 focus:border-primary pb-2 focus:outline-none transition-colors placeholder-slate-300"
          />
        </div>

        {/* Category + Version row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Category
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full text-sm font-semibold text-on-surface bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            >
              {CATEGORIES.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
            <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
              Version
            </label>
            <input
              type="text"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              placeholder="1.0"
              className="w-full text-sm font-semibold text-on-surface bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20"
            />
          </div>
        </div>

        {/* Description */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            Description
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Brief overview of the SOP document and its purpose..."
            rows={3}
            className="w-full text-sm text-on-surface bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y"
          />
        </div>

        {/* Content Editor */}
        <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/10 p-6">
          <label className="block text-xs font-bold uppercase tracking-widest text-slate-400 mb-3">
            SOP Content
          </label>
          <p className="text-xs text-slate-400 mb-4">
            Write or paste the full SOP body text. Use blank lines to separate sections.
          </p>
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={"Section 1: Purpose\n\nDescribe the purpose of this SOP...\n\nSection 2: Scope\n\nDescribe the scope and applicability..."}
            rows={20}
            className="w-full text-sm text-on-surface bg-surface-container rounded-xl px-4 py-3 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-primary/20 resize-y font-mono leading-relaxed"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4">
          <Link
            href="/sop"
            className="inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
          >
            <span className="material-symbols-outlined text-[18px]">arrow_back</span>
            Cancel
          </Link>
          <button
            type="submit"
            disabled={saving}
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {saving ? (
              <>
                <span className="material-symbols-outlined text-[18px] animate-spin">progress_activity</span>
                Saving...
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-[18px]">publish</span>
                Publish SOP
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
