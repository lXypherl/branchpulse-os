import Link from 'next/link';
import { notFound } from 'next/navigation';
import prisma from '@/lib/prisma';
import SopStatusActions from './SopStatusActions';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const categoryColors: Record<string, string> = {
  Safety: 'bg-red-50 text-red-700 border-red-100',
  Operations: 'bg-blue-50 text-blue-700 border-blue-100',
  Inventory: 'bg-amber-50 text-amber-700 border-amber-100',
  Brand: 'bg-purple-50 text-purple-700 border-purple-100',
  Finance: 'bg-emerald-50 text-emerald-700 border-emerald-100',
};

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
}

function formatDateTime(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

const statusLabel = (status: string) => {
  switch (status) {
    case 'CURRENT': return 'Current';
    case 'UNDER_REVIEW': return 'Under Review';
    case 'ARCHIVED': return 'Archived';
    default: return status;
  }
};

const statusConfig: Record<string, { bg: string; text: string; icon: string }> = {
  CURRENT: { bg: 'bg-emerald-50', text: 'text-emerald-700', icon: 'check_circle' },
  UNDER_REVIEW: { bg: 'bg-amber-50', text: 'text-amber-700', icon: 'pending' },
  ARCHIVED: { bg: 'bg-slate-100', text: 'text-slate-500', icon: 'archive' },
};

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function SOPDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const sop = await prisma.sopDocument.findUnique({
    where: { id },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatarUrl: true,
        },
      },
    },
  });

  if (!sop) {
    notFound();
  }

  const sc = statusConfig[sop.status] || statusConfig.CURRENT;

  return (
    <div className="max-w-[1100px] mx-auto">
      {/* ------------------------------------------------------------------ */}
      {/*  BREADCRUMB                                                        */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400 mb-6">
        <Link href="/sop" className="hover:text-primary transition-colors">
          SOP Library
        </Link>
        <span className="text-slate-300">&gt;</span>
        <span className="text-on-surface line-clamp-1">{sop.title}</span>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  HEADER                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm p-8 mb-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
          {/* Left: Title + Meta */}
          <div className="flex-1">
            <div className="flex flex-wrap items-center gap-3 mb-4">
              <span
                className={`px-3 py-1 rounded-lg text-[11px] font-bold border ${
                  categoryColors[sop.category] || 'bg-slate-50 text-slate-700 border-slate-100'
                }`}
              >
                {sop.category}
              </span>
              <span
                className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-[11px] font-bold ${sc.bg} ${sc.text}`}
              >
                <span className="material-symbols-outlined text-[14px]">{sc.icon}</span>
                {statusLabel(sop.status)}
              </span>
              <span className="px-3 py-1 rounded-lg text-[11px] font-bold bg-slate-50 text-slate-600 border border-slate-100">
                v{sop.version}
              </span>
            </div>

            <h1 className="text-3xl font-black text-on-surface tracking-tight mb-3">
              {sop.title}
            </h1>

            {sop.description && (
              <p className="text-sm text-on-surface-variant mb-4 max-w-2xl">
                {sop.description}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-400">
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">person</span>
                <span className="font-medium">{sop.createdBy.name}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">calendar_today</span>
                <span>Created {formatDate(sop.createdAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">update</span>
                <span>Updated {formatDateTime(sop.updatedAt)}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="material-symbols-outlined text-[14px]">article</span>
                <span>{sop.sections} section{sop.sections !== 1 ? 's' : ''}</span>
              </div>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex flex-col gap-3">
            <Link
              href={`/sop/${sop.id}/edit`}
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-primary to-primary-container text-on-primary text-sm font-semibold shadow-md hover:shadow-lg transition-shadow"
            >
              <span className="material-symbols-outlined text-[18px]">edit</span>
              Edit Document
            </Link>
            <Link
              href="/sop"
              className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors"
            >
              <span className="material-symbols-outlined text-[18px]">arrow_back</span>
              Back to Library
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  TWO-COLUMN LAYOUT: Content + Sidebar                              */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-8">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm p-8">
            <div className="flex items-center gap-2 mb-6">
              <span className="material-symbols-outlined text-primary text-[20px]">description</span>
              <h2 className="text-lg font-bold text-on-surface">Document Content</h2>
            </div>
            <div className="prose prose-slate max-w-none">
              <div className="text-sm text-on-surface leading-relaxed whitespace-pre-wrap font-[system-ui]">
                {sop.content}
              </div>
            </div>
          </div>
        </div>

        {/* Sidebar */}
        <div className="lg:col-span-4">
          <div className="sticky top-28 space-y-6">
            {/* Status Actions */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Status Actions
              </p>
              <SopStatusActions sopId={sop.id} currentStatus={sop.status} />
            </div>

            {/* Document Info */}
            <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/10 shadow-sm p-6">
              <p className="text-xs font-bold uppercase tracking-widest text-slate-400 mb-4">
                Document Info
              </p>
              <div className="space-y-4">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Author
                  </p>
                  <div className="flex items-center gap-2">
                    {sop.createdBy.avatarUrl ? (
                      <img
                        src={sop.createdBy.avatarUrl}
                        alt={sop.createdBy.name}
                        className="w-6 h-6 rounded-full"
                      />
                    ) : (
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-[10px] font-bold">
                        {sop.createdBy.name.split(' ').map(w => w[0]).join('')}
                      </span>
                    )}
                    <span className="text-sm font-medium text-on-surface">
                      {sop.createdBy.name}
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Version
                  </p>
                  <p className="text-sm font-semibold text-on-surface">v{sop.version}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Category
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{sop.category}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Sections
                  </p>
                  <p className="text-sm font-semibold text-on-surface">{sop.sections}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Created
                  </p>
                  <p className="text-sm text-on-surface-variant">{formatDateTime(sop.createdAt)}</p>
                </div>
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-widest text-slate-300 mb-1">
                    Last Updated
                  </p>
                  <p className="text-sm text-on-surface-variant">{formatDateTime(sop.updatedAt)}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
