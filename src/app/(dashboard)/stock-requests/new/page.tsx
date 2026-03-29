'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

interface Branch {
  id: string;
  name: string;
  code: string;
}

interface LineItem {
  name: string;
  quantity: number;
}

export default function NewStockRequestPage() {
  const router = useRouter();
  const [branches, setBranches] = useState<Branch[]>([]);
  const [branchId, setBranchId] = useState('');
  const [notes, setNotes] = useState('');
  const [items, setItems] = useState<LineItem[]>([]);
  const [itemName, setItemName] = useState('');
  const [itemQty, setItemQty] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    fetch('/api/branches')
      .then((r) => r.json())
      .then((data) => {
        if (Array.isArray(data)) setBranches(data);
      })
      .catch(() => setBranches([]));
  }, []);

  const addItem = () => {
    const name = itemName.trim();
    if (!name || itemQty < 1) return;
    setItems((prev) => [...prev, { name, quantity: itemQty }]);
    setItemName('');
    setItemQty(1);
  };

  const removeItem = (index: number) => {
    setItems((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!branchId) {
      setError('Please select a branch.');
      return;
    }
    if (items.length === 0) {
      setError('Please add at least one item.');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/stock-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          branchId,
          requestedById: '__CURRENT_USER__',
          items,
          notes: notes.trim() || undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || 'Failed to create stock request.');
        setSubmitting(false);
        return;
      }

      router.push('/stock-requests');
      router.refresh();
    } catch {
      setError('Network error. Please try again.');
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-[800px] mx-auto">
      <header className="mb-10">
        <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">New Stock Request</h1>
        <p className="text-on-surface-variant font-medium">Submit a supply request for a branch.</p>
      </header>

      <form onSubmit={handleSubmit} className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 p-8 space-y-6">
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-sm font-medium">
            {error}
          </div>
        )}

        {/* Branch selector */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Branch
          </label>
          <select
            value={branchId}
            onChange={(e) => setBranchId(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
          >
            <option value="">Select a branch...</option>
            {branches.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.code})
              </option>
            ))}
          </select>
        </div>

        {/* Items builder */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Items
          </label>
          <div className="flex gap-3 mb-3">
            <input
              type="text"
              placeholder="Item name"
              value={itemName}
              onChange={(e) => setItemName(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addItem(); } }}
              className="flex-1 px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <input
              type="number"
              min={1}
              value={itemQty}
              onChange={(e) => setItemQty(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-24 px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface text-center focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
            />
            <button
              type="button"
              onClick={addItem}
              className="px-5 py-3 bg-surface-container-low text-on-surface font-semibold rounded-xl border border-outline-variant/30 hover:bg-surface-container transition-all"
            >
              Add Item
            </button>
          </div>

          {items.length > 0 && (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-surface-container-low/50 rounded-xl"
                >
                  <span className="text-sm text-on-surface">
                    <span className="font-bold">{item.name}</span>
                    <span className="text-on-surface-variant ml-2">x {item.quantity}</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-tertiary text-xs font-bold hover:underline"
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
          )}

          {items.length === 0 && (
            <p className="text-sm text-on-surface-variant/60 italic">No items added yet.</p>
          )}
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Notes
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Optional notes or instructions..."
            className="w-full px-4 py-3 rounded-xl border border-outline-variant/30 bg-surface-container-lowest text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all resize-none"
          />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
          >
            {submitting ? 'Submitting...' : 'Submit Request'}
          </button>
          <button
            type="button"
            onClick={() => router.push('/stock-requests')}
            className="px-6 py-3 text-on-surface-variant font-semibold rounded-xl hover:bg-surface-container-low transition-all"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
