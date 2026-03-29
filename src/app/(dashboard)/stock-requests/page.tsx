import prisma from '@/lib/prisma';
import Link from 'next/link';
import { StockRequestActions } from '@/components/stock-requests/ActionButtons';

export const dynamic = 'force-dynamic';

async function getData() {
  try {
    const requests = await prisma.stockRequest.findMany({
      include: { branch: true, requestedBy: true },
      orderBy: { createdAt: 'desc' },
    });
    return requests;
  } catch {
    return [];
  }
}

export default async function StockRequestsPage() {
  const dbRequests = await getData();

  const demoRequests = dbRequests.map((r: any) => ({
    id: r.id,
    branch: r.branch?.name ?? 'Unknown',
    requester: r.requestedBy?.name ?? 'Unknown',
    items: Array.isArray(r.items) ? (r.items as any[]).map((i: any) => i.name || i).join(', ') : String(r.items),
    status: r.status,
    date: new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
  }));

  const statusColor: Record<string, string> = {
    PENDING: 'bg-amber-100 text-amber-700',
    APPROVED: 'bg-blue-100 text-blue-700',
    FULFILLED: 'bg-emerald-100 text-emerald-700',
    REJECTED: 'bg-red-100 text-red-700',
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">Stock Requests</h1>
          <p className="text-on-surface-variant font-medium">Branch supply requests, approvals, and fulfillment tracking.</p>
        </div>
        <Link
          href="/stock-requests/new"
          className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Request
        </Link>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-surface-container-low/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branch</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Requested By</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Items</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Status</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Date</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {demoRequests.map((req) => (
              <tr key={req.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4 font-bold text-sm text-on-surface">{req.branch}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{req.requester}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant max-w-xs truncate">{req.items}</td>
                <td className="px-6 py-4">
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${statusColor[req.status]}`}>{req.status}</span>
                </td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{req.date}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <StockRequestActions id={req.id} status={req.status} />
                    <Link
                      href={`/stock-requests/${req.id}`}
                      className="text-primary text-xs font-bold hover:underline"
                    >
                      View Details
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
