import Link from 'next/link';
import prisma from '@/lib/prisma';

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

const ALL_CATEGORIES = ['Safety', 'Operations', 'Inventory', 'Brand', 'Finance'];

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/*  Page (Server Component)                                                   */
/* -------------------------------------------------------------------------- */

export default async function SOPLibraryPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; search?: string }>;
}) {
  const params = await searchParams;
  const activeCategory = params.category || null;
  const searchQuery = params.search || '';

  /* ---- Data fetch ---- */
  type SopRow = {
    id: string;
    title: string;
    description: string | null;
    category: string;
    version: string;
    status: string;
    sections: number;
    updatedAt: Date;
    createdBy: { name: string };
  };

  let sops: SopRow[] = [];

  try {
    const where: Record<string, unknown> = {};

    if (activeCategory) {
      where.category = activeCategory;
    }

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    const dbSops = await prisma.sopDocument.findMany({
      where,
      include: {
        createdBy: { select: { name: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    sops = dbSops.map((s) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      category: s.category,
      version: s.version,
      status: s.status,
      sections: s.sections,
      updatedAt: s.updatedAt,
      createdBy: { name: s.createdBy.name },
    }));
  } catch {
    sops = [];
  }

  /* ---- Derive category counts ---- */
  const categoryCounts: Record<string, number> = {};
  for (const cat of ALL_CATEGORIES) categoryCounts[cat] = 0;
  // Re-fetch full counts (unfiltered) for chips
  try {
    const allSops = await prisma.sopDocument.findMany({ select: { category: true } });
    for (const s of allSops) {
      categoryCounts[s.category] = (categoryCounts[s.category] || 0) + 1;
    }
  } catch {
    // leave zero counts
  }

  const statusLabel = (status: string) => {
    switch (status) {
      case 'CURRENT': return 'Current';
      case 'UNDER_REVIEW': return 'Under Review';
      case 'ARCHIVED': return 'Archived';
      default: return status;
    }
  };

  const statusColor = (status: string) => {
    switch (status) {
      case 'CURRENT': return 'text-secondary';
      case 'UNDER_REVIEW': return 'text-amber-600';
      case 'ARCHIVED': return 'text-slate-400';
      default: return 'text-slate-500';
    }
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      {/* ------------------------------------------------------------------ */}
      {/*  PAGE HEADER                                                       */}
      {/* ------------------------------------------------------------------ */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">
            SOP Library
          </h1>
          <p className="text-on-surface-variant font-medium">
            Governed standards and operating procedures across all branches.
          </p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">
              AI Q&A Active
            </span>
          </div>
          <Link
            href="/sop/new"
            className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload SOP
          </Link>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/*  AI Q&A WIDGET                                                     */}
      {/* ------------------------------------------------------------------ */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary rounded-full blur-[60px] opacity-20" />
        <div className="relative z-10 flex flex-col md:flex-row items-center gap-6">
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
            <form action="/sop" method="GET">
              <div className="bg-white/10 rounded-xl border border-white/10 p-4 flex items-center gap-3">
                <span className="material-symbols-outlined text-slate-400">search</span>
                <input
                  type="text"
                  name="search"
                  defaultValue={searchQuery}
                  placeholder="Ask a question about SOPs..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-semibold text-white transition-colors"
                >
                  Search
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  CATEGORY FILTER CHIPS                                             */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          href="/sop"
          className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
            !activeCategory
              ? 'bg-on-surface text-white border-on-surface'
              : 'bg-surface-container-low text-on-surface-variant border-outline-variant/20 hover:bg-surface-container'
          }`}
        >
          All ({Object.values(categoryCounts).reduce((a, b) => a + b, 0)})
        </Link>
        {ALL_CATEGORIES.map((cat) => (
          <Link
            key={cat}
            href={activeCategory === cat ? '/sop' : `/sop?category=${cat}`}
            className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${
              activeCategory === cat
                ? 'bg-on-surface text-white border-on-surface'
                : `${categoryColors[cat]} hover:opacity-80`
            }`}
          >
            {cat} ({categoryCounts[cat] || 0})
          </Link>
        ))}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  SEARCH RESULTS INDICATOR                                          */}
      {/* ------------------------------------------------------------------ */}
      {searchQuery && (
        <div className="mb-6 flex items-center gap-3">
          <span className="text-sm text-on-surface-variant">
            Showing {sops.length} result{sops.length !== 1 ? 's' : ''} for{' '}
            <span className="font-semibold text-on-surface">&quot;{searchQuery}&quot;</span>
          </span>
          <Link
            href="/sop"
            className="text-xs font-semibold text-primary hover:underline"
          >
            Clear search
          </Link>
        </div>
      )}

      {/* ------------------------------------------------------------------ */}
      {/*  SOP GRID                                                          */}
      {/* ------------------------------------------------------------------ */}
      {sops.length === 0 ? (
        <div className="text-center py-20">
          <span className="material-symbols-outlined text-slate-300 text-[48px] mb-4 block">
            description
          </span>
          <p className="text-lg font-semibold text-on-surface-variant mb-2">
            No SOPs found
          </p>
          <p className="text-sm text-slate-400 mb-6">
            {searchQuery
              ? 'Try adjusting your search terms.'
              : 'Get started by uploading your first SOP document.'}
          </p>
          <Link
            href="/sop/new"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-on-primary font-semibold rounded-xl hover:opacity-90 transition-opacity"
          >
            <span className="material-symbols-outlined text-[20px]">add</span>
            Create SOP
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sops.map((sop) => (
            <Link
              key={sop.id}
              href={`/sop/${sop.id}`}
              className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 p-6 hover:shadow-ambient-lg transition-shadow cursor-pointer group block"
            >
              <div className="flex items-start justify-between mb-4">
                <span
                  className={`px-2 py-1 rounded text-[10px] font-bold border ${
                    categoryColors[sop.category] || 'bg-slate-50 text-slate-700 border-slate-100'
                  }`}
                >
                  {sop.category}
                </span>
                <span className="text-[10px] font-bold text-on-surface-variant">
                  v{sop.version}
                </span>
              </div>
              <h3 className="text-lg font-bold text-on-surface tracking-tight mb-2 group-hover:text-primary transition-colors">
                {sop.title}
              </h3>
              {sop.description && (
                <p className="text-xs text-on-surface-variant mb-2 line-clamp-2">
                  {sop.description}
                </p>
              )}
              <p className="text-xs text-on-surface-variant mb-4">
                {sop.sections} section{sop.sections !== 1 ? 's' : ''} &middot; Updated{' '}
                {formatDate(sop.updatedAt)} &middot; {sop.createdBy.name}
              </p>
              <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
                <span
                  className={`text-[10px] font-bold uppercase tracking-widest ${statusColor(
                    sop.status
                  )}`}
                >
                  {statusLabel(sop.status)}
                </span>
                <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:translate-x-1 transition-transform">
                  arrow_forward
                </span>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
