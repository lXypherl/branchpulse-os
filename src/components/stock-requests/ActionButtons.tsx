'use client';

import { useRouter } from 'next/navigation';

/**
 * Inline action buttons used in the stock requests list table.
 */
export function StockRequestActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  const handleAction = async (newStatus: string) => {
    await fetch(`/api/stock-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });
    router.refresh();
  };

  if (status === 'PENDING') {
    return (
      <div className="flex gap-2">
        <button
          onClick={() => handleAction('APPROVED')}
          className="text-secondary text-xs font-bold hover:underline"
        >
          Approve
        </button>
        <button
          onClick={() => handleAction('REJECTED')}
          className="text-tertiary text-xs font-bold hover:underline"
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <button
        onClick={() => handleAction('FULFILLED')}
        className="text-secondary text-xs font-bold hover:underline"
      >
        Mark Fulfilled
      </button>
    );
  }

  return null;
}

/**
 * Larger action buttons used on the stock request detail page.
 */
export function StockRequestDetailActions({ id, status }: { id: string; status: string }) {
  const router = useRouter();

  const handleAction = async (newStatus: string) => {
    const res = await fetch(`/api/stock-requests/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status: newStatus }),
    });

    if (res.ok) {
      router.refresh();
    }
  };

  if (status === 'PENDING') {
    return (
      <div className="flex items-center gap-3">
        <button
          onClick={() => handleAction('APPROVED')}
          className="px-6 py-3 bg-gradient-to-br from-secondary to-secondary-container text-on-secondary font-semibold rounded-xl shadow-lg shadow-secondary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Approve
        </button>
        <button
          onClick={() => handleAction('REJECTED')}
          className="px-6 py-3 bg-gradient-to-br from-tertiary to-tertiary-container text-on-tertiary font-semibold rounded-xl shadow-lg shadow-tertiary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          Reject
        </button>
      </div>
    );
  }

  if (status === 'APPROVED') {
    return (
      <button
        onClick={() => handleAction('FULFILLED')}
        className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
      >
        Mark Fulfilled
      </button>
    );
  }

  if (status === 'REJECTED') {
    return (
      <p className="text-sm text-on-surface-variant italic">This request has been rejected. No further actions available.</p>
    );
  }

  if (status === 'FULFILLED') {
    return (
      <p className="text-sm text-on-surface-variant italic">This request has been fulfilled. No further actions available.</p>
    );
  }

  return null;
}
