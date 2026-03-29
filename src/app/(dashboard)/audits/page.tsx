import prisma from '@/lib/prisma';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Fallback data used when the DB query fails or returns empty               */
/* -------------------------------------------------------------------------- */

const fallbackAudits = [
  {
    id: '1',
    branch: { name: 'Downtown Flagship', code: '402' },
    auditor: { name: 'James Smith' },
    reviewer: null,
    template: { category: 'Q3 Safety' },
    status: 'UNDER_REVIEW' as const,
    score: 82,
    createdAt: new Date('2025-10-24'),
  },
  {
    id: '2',
    branch: { name: 'Northside Plaza', code: '115' },
    auditor: { name: 'Laura Reyes' },
    reviewer: { name: 'Sarah Jenkins' },
    template: { category: 'Compliance Audit' },
    status: 'SUBMITTED' as const,
    score: 96,
    createdAt: new Date(),
  },
  {
    id: '3',
    branch: { name: 'South Metro Hub', code: '208' },
    auditor: { name: 'Mark Klein' },
    reviewer: null,
    template: { category: 'Inventory Hygiene' },
    status: 'RETURNED' as const,
    score: 64,
    createdAt: new Date('2025-10-22'),
  },
  {
    id: '4',
    branch: { name: 'East Ridge Mall', code: '301' },
    auditor: { name: 'Ana Martin' },
    reviewer: null,
    template: { category: 'Weekly Check' },
    status: 'APPROVED' as const,
    score: 100,
    createdAt: new Date('2025-10-21'),
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function initials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function formatDate(date: Date) {
  const now = new Date();
  const d = new Date(date);
  const isToday =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (isToday) {
    return `Today, ${d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })}`;
  }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

const avatarColors: Record<string, string> = {
  JS: 'bg-blue-100 text-blue-700',
  LR: 'bg-emerald-100 text-emerald-700',
  MK: 'bg-slate-200 text-slate-600',
  AM: 'bg-purple-100 text-purple-700',
};

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700' },
  SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700' },
  RETURNED: { label: 'Returned', bg: 'bg-red-50', text: 'text-red-700' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  DRAFT: { label: 'Draft', bg: 'bg-slate-50', text: 'text-slate-600' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-50', text: 'text-slate-500' },
};

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
}

/* -------------------------------------------------------------------------- */
/*  Page (Server Component)                                                   */
/* -------------------------------------------------------------------------- */

export default async function AuditsPage() {
  /* ---- Data fetch with fallback ---- */
  type AuditRow = {
    id: string;
    branch: { name: string; code: string };
    auditor: { name: string };
    reviewer: { name: string } | null;
    template: { category: string };
    status: string;
    score: number;
    createdAt: Date;
  };

  let audits: AuditRow[];

  try {
    const dbAudits = await prisma.audit.findMany({
      include: { branch: true, auditor: true, reviewer: true, template: true },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    audits = dbAudits.map((a) => ({
            id: a.id,
            branch: { name: a.branch.name, code: a.branch.code },
            auditor: { name: a.auditor.name },
            reviewer: a.reviewer ? { name: a.reviewer.name } : null,
            template: { category: a.template.category },
            status: a.status as string,
            score: a.score ?? 0,
            createdAt: a.createdAt,
          }));
  } catch {
    audits = [];
  }

  /* ================================================================== */
  /*  RENDER                                                             */
  /* ================================================================== */

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/*  PAGE HEADER                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-widest text-slate-400">
            Operations{' '}
            <span className="text-slate-300 mx-1">&gt;</span>{' '}
            <span className="text-blue-600">Audit Control</span>
          </p>
          <h1 className="text-4xl font-extrabold tracking-tight text-on-background mt-2">
            Audit Management
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Standardizing excellence across 42 active branch locations.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-surface-container text-sm font-semibold text-on-surface hover:bg-surface-container-high transition-colors">
            <span className="material-symbols-outlined text-[18px]">description</span>
            Template Builder
          </button>
          <button className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-br from-[#0058bc] to-[#0070eb] text-sm font-semibold text-white shadow-md hover:shadow-lg transition-shadow">
            <span className="material-symbols-outlined text-[18px]">add_task</span>
            New Audit Schedule
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  3-COLUMN STATS ROW                                                */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {/* Audits in Progress */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/15 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Audits in Progress
            </p>
            <span className="material-symbols-outlined text-blue-500 text-[22px]">
              pending_actions
            </span>
          </div>
          <p className="text-3xl font-extrabold text-on-background mt-2">12</p>
          <p className="text-xs text-blue-600 font-medium mt-1">+2 from last week</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-blue-500" style={{ width: '65%' }} />
          </div>
        </div>

        {/* Pending Review */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/15 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Pending Review
            </p>
            <span className="material-symbols-outlined text-amber-500 text-[22px]">
              rate_review
            </span>
          </div>
          <p className="text-3xl font-extrabold text-on-background mt-2">08</p>
          <p className="text-xs text-amber-600 font-medium mt-1">High Priority</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-amber-400" style={{ width: '40%' }} />
          </div>
        </div>

        {/* Completed Audits */}
        <div className="bg-surface-container-lowest p-6 rounded-3xl border border-outline-variant/15 shadow-sm">
          <div className="flex items-center justify-between">
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Completed Audits
            </p>
            <span className="material-symbols-outlined text-emerald-500 text-[22px]">
              verified
            </span>
          </div>
          <p className="text-3xl font-extrabold text-on-background mt-2">154</p>
          <p className="text-xs text-emerald-600 font-medium mt-1">98% Compliance</p>
          <div className="mt-4 h-1.5 w-full rounded-full bg-slate-100 overflow-hidden">
            <div className="h-full rounded-full bg-emerald-500" style={{ width: '98%' }} />
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  MAIN CONTENT: 12-COL GRID                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/*  LEFT 8 COLS  -  AUDIT QUEUE                                   */}
        {/* ============================================================== */}
        <div className="col-span-12 xl:col-span-8">
          <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 shadow-sm overflow-hidden">
            {/* Card Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-outline-variant/10">
              <h2 className="text-lg font-bold text-on-background">Audit Queue</h2>
              <select className="text-xs font-medium text-slate-500 bg-surface-container rounded-lg px-3 py-1.5 border border-outline-variant/20 focus:outline-none focus:ring-2 focus:ring-blue-500/20">
                <option>Sort by: Latest</option>
                <option>Sort by: Score</option>
                <option>Sort by: Status</option>
              </select>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="border-b border-outline-variant/10">
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Branch Location
                    </th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Auditor
                    </th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Score
                    </th>
                    <th className="px-6 py-3 text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                      Date
                    </th>
                  </tr>
                </thead>

                <tbody className="divide-y divide-outline-variant/8">
                  {audits.map((audit) => {
                    const ini = initials(audit.auditor.name);
                    const colorCls = avatarColors[ini] ?? 'bg-slate-200 text-slate-600';
                    const status = statusConfig[audit.status] ?? statusConfig.DRAFT;
                    const isHighlighted = audit.status === 'SUBMITTED';

                    return (
                      <tr
                        key={audit.id}
                        className={
                          isHighlighted
                            ? 'bg-blue-50/30 border-l-4 border-blue-600'
                            : 'hover:bg-surface-container-low/60 transition-colors'
                        }
                      >
                        {/* Branch */}
                        <td className="px-6 py-4">
                          <Link href={`/audits/${audit.id}`} className="text-sm font-semibold text-on-background hover:text-primary hover:underline transition-colors">
                            {audit.branch.name}
                          </Link>
                          <p className="text-xs text-slate-400 mt-0.5">
                            Store #{audit.branch.code}, {audit.template.category}
                          </p>
                        </td>

                        {/* Auditor */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span
                              className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-[10px] font-bold ${colorCls}`}
                            >
                              {ini}
                            </span>
                            <span className="text-sm text-on-surface-variant">
                              {audit.auditor.name}
                            </span>
                          </div>
                        </td>

                        {/* Status */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${status.bg} ${status.text}`}
                          >
                            {status.label}
                          </span>
                        </td>

                        {/* Score */}
                        <td className="px-6 py-4">
                          <span className={`text-sm font-bold ${scoreColor(audit.score)}`}>
                            {audit.score}%
                          </span>
                        </td>

                        {/* Date */}
                        <td className="px-6 py-4 text-sm text-slate-500 whitespace-nowrap">
                          {formatDate(audit.createdAt)}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/*  RIGHT 4 COLS  -  AUDIT DETAIL PREVIEW                         */}
        {/* ============================================================== */}
        <div className="col-span-12 xl:col-span-4">
          <div className="sticky top-28 bg-surface-container-lowest rounded-3xl border border-outline-variant/15 shadow-sm p-6 space-y-6">
            {/* Live Preview label */}
            <p className="text-[10px] font-bold uppercase tracking-widest text-blue-600">
              Live Preview
            </p>

            {/* Branch title + submission ID */}
            <div>
              <h3 className="text-2xl font-bold text-on-background">Northside Plaza</h3>
              <p className="text-xs text-slate-400 mt-1">
                Submission ID:{' '}
                <span className="font-medium text-slate-500">#BP-99812</span>
              </p>
            </div>

            {/* Score badge */}
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-emerald-50 border border-emerald-200/60">
                <span className="text-2xl font-extrabold text-emerald-600">96</span>
              </div>
              <div>
                <p className="text-sm font-semibold text-on-background">Audit Score</p>
                <p className="text-xs text-emerald-600 font-medium">Excellent</p>
              </div>
            </div>

            {/* Critical Evidence */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Critical Evidence
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div className="group relative aspect-square rounded-2xl bg-slate-100 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300 text-[32px]">
                      image
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-white text-[20px]">
                      zoom_in
                    </span>
                  </div>
                </div>
                <div className="group relative aspect-square rounded-2xl bg-slate-100 overflow-hidden cursor-pointer">
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-slate-300 text-[32px]">
                      image
                    </span>
                  </div>
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <span className="material-symbols-outlined text-white text-[20px]">
                      zoom_in
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Failed Items */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Failed Items (1)
              </p>
              <div className="rounded-2xl bg-red-50/70 border border-red-200/40 p-4">
                <div className="flex items-start gap-3">
                  <span className="material-symbols-outlined text-red-500 text-[20px] mt-0.5">
                    error
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-red-800">
                      Safety Exit Obstruction
                    </p>
                    <p className="text-xs text-red-600/80 mt-1 leading-relaxed">
                      Emergency exit on level 2 partially blocked by promotional display
                      stand. Immediate corrective action required per fire safety code
                      FRC-204.
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Assigned Reviewer */}
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">
                Assigned Reviewer
              </p>
              <div className="flex items-center gap-3">
                <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-violet-100 text-violet-700 text-[11px] font-bold">
                  SJ
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-background">Sarah Jenkins</p>
                  <p className="text-xs text-slate-400">Regional QA Lead</p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3 pt-2">
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-on-background text-sm font-semibold text-white hover:bg-slate-800 transition-colors">
                <span className="material-symbols-outlined text-[16px]">check_circle</span>
                Approve Audit
              </button>
              <button className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white text-sm font-semibold text-on-background border border-outline-variant/40 hover:bg-surface-container-low transition-colors">
                <span className="material-symbols-outlined text-[16px]">edit_note</span>
                Request Edit
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
