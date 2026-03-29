import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { isReadOnly } from '@/lib/rbac';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { StockRequestDetailActions } from '@/components/stock-requests/ActionButtons';

export const dynamic = 'force-dynamic';

async function getStockRequest(id: string) {
  try {
    return await prisma.stockRequest.findUnique({
      where: { id },
      include: {
        branch: {
          select: { id: true, name: true, code: true, status: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });
  } catch {
    return null;
  }
}

const statusColor: Record<string, string> = {
  PENDING: 'bg-amber-100 text-amber-700',
  APPROVED: 'bg-blue-100 text-blue-700',
  FULFILLED: 'bg-emerald-100 text-emerald-700',
  REJECTED: 'bg-red-100 text-red-700',
};

export default async function StockRequestDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await getSession();
  if (!user) redirect('/login');

  const { id } = await params;
  const request = await getStockRequest(id);

  if (!request) {
    return (
      <div className="max-w-[800px] mx-auto text-center py-20">
        <h1 className="text-2xl font-black text-on-surface mb-2">Not Found</h1>
        <p className="text-on-surface-variant mb-6">This stock request could not be found.</p>
        <Link
          href="/stock-requests"
          className="text-primary font-semibold hover:underline"
        >
          Back to Stock Requests
        </Link>
      </div>
    );
  }

  const items: { name: string; quantity: number }[] = Array.isArray(request.items)
    ? (request.items as any[])
    : [];

  const readOnly = isReadOnly(user.role);

  return (
    <div className="max-w-[800px] mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <Link
            href="/stock-requests"
            className="text-primary text-sm font-semibold hover:underline inline-flex items-center gap-1 mb-3"
          >
            <span className="material-symbols-outlined text-[16px]">arrow_back</span>
            Back to Stock Requests
          </Link>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
            Stock Request
          </h1>
          <p className="text-on-surface-variant font-medium">
            Request for {request.branch?.name ?? 'Unknown Branch'}
          </p>
        </div>
        <span
          className={`px-4 py-2 rounded-full text-xs font-bold uppercase self-start md:self-auto ${statusColor[request.status] ?? 'bg-gray-100 text-gray-700'}`}
        >
          {request.status}
        </span>
      </header>

      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 p-8 space-y-6">
        {/* Branch */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Branch
          </label>
          <p className="text-on-surface font-semibold">
            {request.branch?.name ?? 'Unknown'}{' '}
            {request.branch?.code && (
              <span className="text-on-surface-variant font-normal">({request.branch.code})</span>
            )}
          </p>
        </div>

        {/* Requested By */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Requested By
          </label>
          <p className="text-on-surface font-semibold">
            {request.requestedBy?.name ?? 'Unknown'}
            {request.requestedBy?.email && (
              <span className="text-on-surface-variant font-normal ml-2">{request.requestedBy.email}</span>
            )}
          </p>
        </div>

        {/* Date */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
            Date
          </label>
          <p className="text-on-surface">
            {new Date(request.createdAt).toLocaleDateString('en-US', {
              month: 'long',
              day: 'numeric',
              year: 'numeric',
            })}
          </p>
        </div>

        {/* Items */}
        <div>
          <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-2">
            Items
          </label>
          {items.length > 0 ? (
            <ul className="space-y-2">
              {items.map((item, i) => (
                <li
                  key={i}
                  className="flex items-center justify-between px-4 py-3 bg-surface-container-low/50 rounded-xl"
                >
                  <span className="text-sm font-bold text-on-surface">{item.name}</span>
                  <span className="text-sm text-on-surface-variant">x {item.quantity}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-on-surface-variant italic">No structured items data.</p>
          )}
        </div>

        {/* Notes */}
        {request.notes && (
          <div>
            <label className="block text-xs font-bold uppercase tracking-widest text-on-surface-variant mb-1">
              Notes
            </label>
            <p className="text-on-surface text-sm whitespace-pre-wrap">{request.notes}</p>
          </div>
        )}

        {/* Actions */}
        {!readOnly && (
          <div className="pt-4 border-t border-outline-variant/10">
            <StockRequestDetailActions id={request.id} status={request.status} />
          </div>
        )}
      </div>
    </div>
  );
}
