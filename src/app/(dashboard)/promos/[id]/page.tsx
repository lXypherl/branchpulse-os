import prisma from '@/lib/prisma';
import Link from 'next/link';
import PromoDetailActions from './PromoDetailActions';

export const dynamic = 'force-dynamic';

async function getPromoCheck(id: string) {
  try {
    const promo = await prisma.promoCheck.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });
    return promo;
  } catch {
    return null;
  }
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PENDING: 'bg-blue-100 text-blue-700',
    CONFIRMED: 'bg-emerald-100 text-emerald-700',
    FAILED: 'bg-red-100 text-red-700',
  };
  return (
    <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${styles[status] || 'bg-gray-100 text-gray-700'}`}>
      {status}
    </span>
  );
}

export default async function PromoDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const promo = await getPromoCheck(id);

  if (!promo) {
    return (
      <div className="max-w-3xl mx-auto text-center py-20">
        <span className="material-symbols-outlined text-[48px] text-on-surface-variant mb-4">error</span>
        <h1 className="text-2xl font-bold text-on-surface mb-2">Promo Check Not Found</h1>
        <p className="text-on-surface-variant mb-6">The campaign you are looking for does not exist or you do not have access.</p>
        <Link
          href="/promos"
          className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Promos
        </Link>
      </div>
    );
  }

  const checklistItems = (promo.checklistItems as { label: string; completed: boolean }[]) || [];
  const dueDateFormatted = promo.dueDate
    ? new Date(promo.dueDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;
  const completedAtFormatted = promo.completedAt
    ? new Date(promo.completedAt).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="max-w-3xl mx-auto">
      {/* Breadcrumb */}
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Link href="/promos" className="hover:text-slate-600 transition-colors">Promos</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-blue-600">Detail</span>
        </nav>
      </div>

      {/* Header Card */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-8 shadow-sm mb-6">
        <div className="flex items-start justify-between mb-6">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">{promo.name}</h1>
              <StatusBadge status={promo.status} />
            </div>
            {promo.description && (
              <p className="text-on-surface-variant font-medium mt-2 max-w-xl">{promo.description}</p>
            )}
          </div>
        </div>

        {/* Metadata Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Branch</p>
            <p className="text-sm font-semibold text-on-surface">
              {promo.branch?.name || 'Unknown'}
            </p>
            {promo.branch?.code && (
              <p className="text-xs text-on-surface-variant">{promo.branch.code}</p>
            )}
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Status</p>
            <p className="text-sm font-semibold text-on-surface">{promo.status}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Due Date</p>
            <p className="text-sm font-semibold text-on-surface">{dueDateFormatted || 'No due date'}</p>
          </div>
          <div className="bg-surface-container-low rounded-xl p-4">
            <p className="text-[10px] font-bold text-on-surface-variant uppercase tracking-widest mb-1">Completed</p>
            <p className="text-sm font-semibold text-on-surface">{completedAtFormatted || 'Not yet'}</p>
          </div>
        </div>
      </div>

      {/* Interactive Section (client component) */}
      <PromoDetailActions
        promoId={promo.id}
        currentStatus={promo.status}
        initialChecklistItems={checklistItems}
      />

      {/* Back Link */}
      <div className="mt-8">
        <Link
          href="/promos"
          className="inline-flex items-center gap-2 text-sm font-semibold text-on-surface-variant hover:text-on-surface transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to all promos
        </Link>
      </div>
    </div>
  );
}
