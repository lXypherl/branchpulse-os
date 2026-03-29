'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import FileUpload from '@/components/shared/FileUpload';

interface ChecklistItem {
  label: string;
  completed: boolean;
}

interface PromoDetailActionsProps {
  promoId: string;
  currentStatus: string;
  initialChecklistItems: ChecklistItem[];
  initialEvidenceUrls?: string[];
}

export default function PromoDetailActions({
  promoId,
  currentStatus,
  initialChecklistItems,
  initialEvidenceUrls = [],
}: PromoDetailActionsProps) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>(initialChecklistItems);
  const [status, setStatus] = useState(currentStatus);
  const [saving, setSaving] = useState(false);
  const [statusSaving, setStatusSaving] = useState(false);
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>(initialEvidenceUrls);
  const [savingEvidence, setSavingEvidence] = useState(false);

  async function toggleItem(index: number) {
    const updated = items.map((item, i) =>
      i === index ? { ...item, completed: !item.completed } : item
    );
    setItems(updated);
    setSaving(true);

    try {
      const res = await fetch(`/api/promo-checks/${promoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ checklistItems: updated }),
      });
      if (!res.ok) {
        // Revert on failure
        setItems(items);
      }
    } catch {
      setItems(items);
    } finally {
      setSaving(false);
    }
  }

  async function updateStatus(newStatus: 'CONFIRMED' | 'FAILED' | 'PENDING') {
    setStatusSaving(true);
    try {
      const res = await fetch(`/api/promo-checks/${promoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (res.ok) {
        setStatus(newStatus);
        router.refresh();
      }
    } catch {
      // Status update failed silently
    } finally {
      setStatusSaving(false);
    }
  }

  async function handleEvidenceChange(urls: string[]) {
    setEvidenceUrls(urls);
    setSavingEvidence(true);
    try {
      const res = await fetch(`/api/promo-checks/${promoId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ evidenceUrls: urls }),
      });
      if (res.ok) {
        router.refresh();
      } else {
        setEvidenceUrls(initialEvidenceUrls);
      }
    } catch {
      setEvidenceUrls(initialEvidenceUrls);
    } finally {
      setSavingEvidence(false);
    }
  }

  const completedCount = items.filter((i) => i.completed).length;
  const totalCount = items.length;

  return (
    <>
      {/* Checklist Card */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-8 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface tracking-tight">Checklist</h2>
          <span className="text-sm font-semibold text-on-surface-variant">
            {completedCount}/{totalCount} completed
            {saving && <span className="ml-2 text-xs text-blue-500">Saving...</span>}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-6">
          <div
            className="h-full bg-secondary transition-all duration-300"
            style={{ width: totalCount > 0 ? `${(completedCount / totalCount) * 100}%` : '0%' }}
          />
        </div>

        {totalCount === 0 ? (
          <p className="text-sm text-on-surface-variant italic">No checklist items.</p>
        ) : (
          <div className="space-y-2">
            {items.map((item, i) => (
              <button
                key={i}
                onClick={() => toggleItem(i)}
                className="w-full flex items-center gap-3 px-4 py-3 bg-surface-container-low rounded-xl hover:bg-surface-container transition-all text-left group"
              >
                <span className={`material-symbols-outlined text-[20px] transition-colors ${
                  item.completed ? 'text-secondary' : 'text-on-surface-variant group-hover:text-on-surface'
                }`}>
                  {item.completed ? 'check_box' : 'check_box_outline_blank'}
                </span>
                <span className={`font-medium transition-all ${
                  item.completed ? 'text-on-surface-variant line-through' : 'text-on-surface'
                }`}>
                  {item.label}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Upload Proof Photo */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-8 shadow-sm mb-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-bold text-on-surface tracking-tight">Upload Proof Photo</h2>
          {savingEvidence && <span className="text-xs text-blue-500 font-medium">Saving...</span>}
        </div>
        <FileUpload value={evidenceUrls} onChange={handleEvidenceChange} maxFiles={10} />
      </div>

      {/* Status Actions Card */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-8 shadow-sm">
        <h2 className="text-lg font-bold text-on-surface tracking-tight mb-6">Campaign Status</h2>
        <div className="flex flex-col sm:flex-row gap-3">
          {status !== 'CONFIRMED' && (
            <button
              onClick={() => updateStatus('CONFIRMED')}
              disabled={statusSaving}
              className="flex-1 py-3 bg-gradient-to-br from-emerald-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg shadow-emerald-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">check_circle</span>
              {statusSaving ? 'Updating...' : 'Mark Confirmed'}
            </button>
          )}
          {status !== 'FAILED' && (
            <button
              onClick={() => updateStatus('FAILED')}
              disabled={statusSaving}
              className="flex-1 py-3 bg-gradient-to-br from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg shadow-red-500/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:hover:scale-100 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">cancel</span>
              {statusSaving ? 'Updating...' : 'Mark Failed'}
            </button>
          )}
          {status !== 'PENDING' && (
            <button
              onClick={() => updateStatus('PENDING')}
              disabled={statusSaving}
              className="flex-1 py-3 bg-surface-container-highest text-on-surface-variant font-semibold rounded-xl hover:bg-surface-variant transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span className="material-symbols-outlined text-[18px]">restart_alt</span>
              {statusSaving ? 'Updating...' : 'Reset to Pending'}
            </button>
          )}
        </div>
      </div>
    </>
  );
}
