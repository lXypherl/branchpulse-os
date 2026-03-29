'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface ChecklistItem {
  label: string;
  completed: boolean;
}

export default function NewPromoPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [branchId, setBranchId] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [checklistItems, setChecklistItems] = useState<ChecklistItem[]>([]);
  const [newItemText, setNewItemText] = useState('');

  useEffect(() => {
    fetch('/api/branches')
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setBranches(data);
      })
      .catch(() => {});
  }, []);

  function addItem() {
    const trimmed = newItemText.trim();
    if (!trimmed) return;
    setChecklistItems((prev) => [...prev, { label: trimmed, completed: false }]);
    setNewItemText('');
  }

  function removeItem(index: number) {
    setChecklistItems((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');

    if (!name.trim()) {
      setError('Campaign name is required.');
      return;
    }
    if (!branchId) {
      setError('Please select a branch.');
      return;
    }
    if (checklistItems.length === 0) {
      setError('Add at least one checklist item.');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/promo-checks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim() || undefined,
          branchId,
          dueDate: dueDate || undefined,
          checklistItems,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create campaign.');
        setLoading(false);
        return;
      }

      router.push('/promos');
    } catch {
      setError('Network error. Please try again.');
      setLoading(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Link href="/promos" className="hover:text-slate-600 transition-colors">Promos</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-blue-600">New Campaign</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-background">New Promo Campaign</h1>
        <p className="text-on-surface-variant mt-1">Create a promotional campaign execution check.</p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-8 shadow-sm space-y-8">
          {error && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700 font-medium">
              {error}
            </div>
          )}

          {/* Campaign Name */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Campaign Name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Summer Sale Launch"
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Description (Optional)
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe the campaign objectives and requirements..."
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline"
            />
          </div>

          {/* Branch Selector */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Branch Location
            </label>
            <select
              value={branchId}
              onChange={(e) => setBranchId(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            >
              <option value="">Select a branch...</option>
              {branches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} ({b.code})
                </option>
              ))}
            </select>
          </div>

          {/* Due Date */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Due Date (Optional)
            </label>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
            />
          </div>

          {/* Checklist Builder */}
          <div>
            <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
              Checklist Items
            </label>
            <div className="flex gap-2 mb-3">
              <input
                type="text"
                value={newItemText}
                onChange={(e) => setNewItemText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    addItem();
                  }
                }}
                placeholder="e.g. Signage displayed at entrance"
                className="flex-1 px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all placeholder:text-outline"
              />
              <button
                type="button"
                onClick={addItem}
                className="px-4 py-3 bg-surface-container-highest text-on-surface font-semibold rounded-xl hover:bg-surface-variant transition-all flex items-center gap-1"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
                Add Item
              </button>
            </div>

            {checklistItems.length > 0 && (
              <div className="space-y-2">
                {checklistItems.map((item, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-4 py-3 bg-surface-container-low rounded-xl"
                  >
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-[18px] text-on-surface-variant">check_box_outline_blank</span>
                      <span className="text-on-surface font-medium">{item.label}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-on-surface-variant hover:text-red-500 transition-colors"
                    >
                      <span className="material-symbols-outlined text-[18px]">close</span>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {checklistItems.length === 0 && (
              <p className="text-sm text-on-surface-variant italic">No items added yet. Add at least one checklist item above.</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-4">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100"
            >
              {loading ? 'Creating...' : 'Create Campaign'}
            </button>
            <Link
              href="/promos"
              className="flex-1 py-3 bg-surface-container-highest text-on-surface-variant font-semibold rounded-xl text-center hover:bg-surface-variant transition-all"
            >
              Cancel
            </Link>
          </div>
        </div>
      </form>
    </div>
  );
}
