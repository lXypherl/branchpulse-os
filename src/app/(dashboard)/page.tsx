import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

const HQ_ROLES = ['HQ_DIRECTOR', 'FRANCHISE_MANAGER', 'EXECUTIVE_VIEWER'];

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getDashboardData() {
  try {
    const [branchCount, auditCount, issueCount, escalationCount, avgScore, pendingCount] = await Promise.all([
      prisma.branch.count({ where: { status: 'ACTIVE' } }),
      prisma.audit.count(),
      prisma.issue.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.escalation.count({ where: { resolvedAt: null } }),
      prisma.branch.aggregate({ where: { status: 'ACTIVE' }, _avg: { complianceScore: true } }),
      prisma.audit.count({ where: { status: 'UNDER_REVIEW' } }),
    ]);

    const complianceScore = Math.round((avgScore._avg.complianceScore ?? 0) * 10) / 10;

    return { branchCount, auditCount, issueCount, escalationCount, complianceScore, pendingAudits: pendingCount, dbError: false };
  } catch {
    return { branchCount: 0, auditCount: 0, issueCount: 0, escalationCount: 0, complianceScore: 0, pendingAudits: 0, dbError: true };
  }
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function HQDashboardPage() {
  const session = await getSession();

  if (!session) redirect('/login');

  // Only HQ-level roles can view the global dashboard
  if (!HQ_ROLES.includes(session.role)) {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-lg rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-ambient text-center">
          <span className="material-symbols-outlined text-tertiary mb-3" style={{ fontSize: 48 }}>lock</span>
          <h1 className="text-xl font-bold text-on-surface mb-2">Access Denied</h1>
          <p className="text-sm text-on-surface-variant">
            You don&apos;t have access to the HQ dashboard. Please navigate to your role-specific dashboard.
          </p>
        </div>
      </div>
    );
  }

  // EXECUTIVE_VIEWER sees the same dashboard but cannot take actions
  const isReadOnly = session.role === 'EXECUTIVE_VIEWER';

  const { branchCount, auditCount, issueCount, escalationCount, complianceScore, pendingAudits, dbError } = await getDashboardData();

  return (
    <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
      {dbError && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <div>
            <p className="font-bold text-sm">Database Connection Error</p>
            <p className="text-xs">Unable to fetch live data. The values shown below may be incomplete. Check your database connection.</p>
          </div>
        </div>
      )}
      {/* ================================================================ */}
      {/* 1. Page Header                                                   */}
      {/* ================================================================ */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">
            Global Operations Command
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Strategic overview for March 2026 &mdash; Across {branchCount} Branches
          </p>
        </div>

        {/* Live status badge */}
        <div className="flex items-center gap-2 rounded-full bg-secondary-container/40 px-4 py-2 text-xs font-semibold tracking-wide text-on-surface">
          <span className="relative flex h-2.5 w-2.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-secondary opacity-75" />
            <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-secondary" />
          </span>
          Live System Status: Optimal
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. KPI Row                                                       */}
      {/* ================================================================ */}
      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* -- Compliance Score ----------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
                verified
              </span>
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              +2.4% vs LW
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Compliance Score
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {complianceScore}%
          </p>
          {/* Progress bar */}
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${complianceScore}%` }}
            />
          </div>
        </div>

        {/* -- Active Audits ------------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>
                assignment
              </span>
            </span>
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-secondary">
              {pendingAudits} Pending
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Active Audits
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {auditCount}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary/10">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${Math.min((auditCount / 150) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* -- Open Issues --------------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 22 }}>
                error_outline
              </span>
            </span>
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-secondary">
              -5% Improved
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Open Issues
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {issueCount}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-tertiary/10">
            <div
              className="h-full rounded-full bg-tertiary transition-all"
              style={{ width: `${Math.min((issueCount / 30) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* -- Escalated Items ----------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          {/* Subtle gradient overlay for urgency */}
          <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-tertiary/5 to-transparent" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10">
                <span className="material-symbols-outlined filled-icon text-tertiary" style={{ fontSize: 22 }}>
                  warning
                </span>
              </span>
              <span className="rounded-full bg-tertiary/10 px-2.5 py-0.5 text-[11px] font-bold text-tertiary">
                HQ Action
              </span>
            </div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Escalated Items
            </p>
            <p className="text-4xl font-black tracking-tighter text-on-surface">
              {String(escalationCount).padStart(2, '0')}
            </p>
            <p className="mt-2 text-[10px] font-medium text-tertiary">
              Immediate HQ Intervention Required
            </p>
            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-tertiary/10">
              <div
                className="h-full rounded-full bg-tertiary transition-all"
                style={{ width: `${Math.min((escalationCount / 10) * 100, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. Main Grid (12-col)                                            */}
      {/* ================================================================ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ============================================================ */}
        {/* LEFT 8 COLS                                                  */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* ---------------------------------------------------------- */}
          {/* Regional Performance Chart                                  */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Regional Performance</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Compliance vs Resolution rate by region
                </p>
              </div>
              <div className="flex items-center gap-4 text-[11px] text-on-surface-variant">
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-primary" />
                  Compliance
                </span>
                <span className="flex items-center gap-1.5">
                  <span className="inline-block h-2.5 w-2.5 rounded-sm bg-secondary-container" />
                  Resolution
                </span>
              </div>
            </div>

            {/* Bar chart (pure CSS) */}
            <div className="flex items-end gap-6">
              {([
                { region: 'North', compliance: 96, resolution: 88 },
                { region: 'South', compliance: 91, resolution: 84 },
                { region: 'East',  compliance: 94, resolution: 90 },
                { region: 'West',  compliance: 89, resolution: 78 },
              ] as const).map((r) => (
                <div key={r.region} className="flex flex-1 flex-col items-center gap-2">
                  <div className="flex w-full items-end justify-center gap-1.5" style={{ height: 180 }}>
                    {/* Compliance bar */}
                    <div className="relative w-8 overflow-hidden rounded-t-lg bg-primary/10">
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg bg-primary transition-all"
                        style={{ height: `${r.compliance}%` }}
                      />
                      <div style={{ height: `${r.compliance}%` }} />
                    </div>
                    {/* Resolution bar */}
                    <div className="relative w-8 overflow-hidden rounded-t-lg bg-secondary-container/30">
                      <div
                        className="absolute bottom-0 w-full rounded-t-lg bg-secondary-container transition-all"
                        style={{ height: `${r.resolution}%` }}
                      />
                      <div style={{ height: `${r.resolution}%` }} />
                    </div>
                  </div>
                  <span className="text-[11px] font-medium text-on-surface-variant">{r.region}</span>
                  <span className="text-[10px] text-on-surface-variant/70">{r.compliance}%</span>
                </div>
              ))}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Priority Escalations Table                                  */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Priority Escalations</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Items requiring immediate HQ attention
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>
                  priority_high
                </span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Branch</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Issue Type</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Duration</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {([
                    {
                      branch: 'BR-0042 Westfield',
                      type: 'Health & Safety',
                      typeColor: 'bg-tertiary/10 text-tertiary',
                      duration: '72h overdue',
                    },
                    {
                      branch: 'BR-0018 Lakewood',
                      type: 'Financial Audit',
                      typeColor: 'bg-primary/10 text-primary',
                      duration: '48h overdue',
                    },
                    {
                      branch: 'BR-0031 Riverside',
                      type: 'Equipment Failure',
                      typeColor: 'bg-tertiary/10 text-tertiary',
                      duration: '24h active',
                    },
                  ] as const).map((row) => (
                    <tr key={row.branch} className="group">
                      <td className="py-3.5 text-sm font-medium text-on-surface">{row.branch}</td>
                      <td className="py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${row.typeColor}`}>
                          {row.type}
                        </span>
                      </td>
                      <td className="py-3.5 text-xs text-on-surface-variant">{row.duration}</td>
                      <td className="py-3.5">
                        {!isReadOnly && (
                          <button className="rounded-lg bg-primary px-3.5 py-1.5 text-[11px] font-bold text-on-primary shadow-sm transition-shadow hover:shadow-md">
                            Intervene
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT 4 COLS                                                 */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* ---------------------------------------------------------- */}
          {/* BranchPulse AI Widget                                       */}
          {/* ---------------------------------------------------------- */}
          <div className="relative overflow-hidden rounded-xl bg-primary-container p-6 shadow-ambient-lg">
            {/* Decorative shimmer */}
            <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-8 -left-8 h-32 w-32 rounded-full bg-white/5 blur-2xl" />

            <div className="relative">
              <div className="mb-4 flex items-center gap-2">
                <span className="material-symbols-outlined filled-icon text-on-primary-container" style={{ fontSize: 20 }}>
                  auto_awesome
                </span>
                <span className="text-xs font-bold uppercase tracking-wider text-on-primary-container/80">
                  BranchPulse AI
                </span>
              </div>

              <blockquote className="mb-5 text-sm leading-relaxed text-on-primary-container">
                &ldquo;West region shows a 6% compliance dip driven by 3 branches missing H&amp;S
                checks this week. Recommend deploying a field auditor to BR-0042 within
                24 hours to prevent further score erosion.&rdquo;
              </blockquote>

              {!isReadOnly && (
                <button className="inline-flex items-center gap-1.5 rounded-lg bg-white/20 px-4 py-2 text-xs font-bold text-on-primary-container backdrop-blur-sm transition-colors hover:bg-white/30">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    arrow_forward
                  </span>
                  Review Suggested Action
                </button>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Network Health Heatmap                                      */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Network Health</h2>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">
                  Branch status heatmap
                </p>
              </div>
              <div className="flex items-center gap-3 text-[10px] text-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-secondary" />
                  OK
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-primary" />
                  Warn
                </span>
                <span className="flex items-center gap-1">
                  <span className="inline-block h-2 w-2 rounded-sm bg-tertiary" />
                  Crit
                </span>
              </div>
            </div>

            {/* Heatmap grid */}
            <div className="grid grid-cols-6 gap-1.5">
              {/* 24 squares -- pattern: mostly green, some blue/warning, a few red/critical */}
              {([
                'ok','ok','ok','ok','warn','ok',
                'ok','ok','crit','ok','ok','ok',
                'ok','warn','ok','ok','ok','ok',
                'ok','ok','ok','crit','ok','warn',
              ] as const).map((status, i) => {
                const base =
                  status === 'ok'   ? 'bg-secondary/70' :
                  status === 'warn' ? 'bg-primary/60' :
                                      'bg-tertiary/80';
                const pulse = status === 'crit' ? 'animate-pulse' : '';
                return (
                  <div
                    key={i}
                    className={`aspect-square rounded-md ${base} ${pulse}`}
                    title={`Branch ${i + 1} - ${status.toUpperCase()}`}
                  />
                );
              })}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Operations Feed                                             */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <h2 className="mb-4 text-sm font-bold text-on-surface">Operations Feed</h2>

            <ul className="space-y-4">
              {([
                {
                  icon: 'check_circle',
                  iconColor: 'text-secondary',
                  title: 'Audit #A-1042 approved',
                  detail: 'BR-0011 Downtown passed compliance review',
                  time: '3 min ago',
                },
                {
                  icon: 'warning',
                  iconColor: 'text-tertiary',
                  title: 'Escalation triggered',
                  detail: 'BR-0042 Westfield - H&S violation 72h overdue',
                  time: '18 min ago',
                },
                {
                  icon: 'inventory',
                  iconColor: 'text-primary',
                  title: 'Stock request fulfilled',
                  detail: 'BR-0007 Oakmont received shipment #SR-308',
                  time: '42 min ago',
                },
                {
                  icon: 'person_add',
                  iconColor: 'text-secondary',
                  title: 'Auditor dispatched',
                  detail: 'Field auditor assigned to North region sweep',
                  time: '1h ago',
                },
                {
                  icon: 'trending_up',
                  iconColor: 'text-primary',
                  title: 'Compliance score updated',
                  detail: 'East region climbed to 94% (+2 pts)',
                  time: '2h ago',
                },
              ] as const).map((event) => (
                <li key={event.title} className="flex gap-3">
                  <span className={`material-symbols-outlined mt-0.5 flex-shrink-0 ${event.iconColor}`} style={{ fontSize: 18 }}>
                    {event.icon}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-on-surface">{event.title}</p>
                    <p className="truncate text-[11px] text-on-surface-variant">{event.detail}</p>
                  </div>
                  <span className="flex-shrink-0 text-[10px] text-on-surface-variant/60">{event.time}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
