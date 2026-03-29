import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import ComplianceTrendChart from '@/components/analytics/ComplianceTrendChart';
import AnomalyList from '@/components/analytics/AnomalyList';
import RecurringIssuesTable from '@/components/analytics/RecurringIssuesTable';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Data fetching: Network Health Score
// ---------------------------------------------------------------------------

async function getNetworkHealthData() {
  try {
    // Current average compliance score
    const currentAvg = await prisma.branch.aggregate({
      where: { status: 'ACTIVE' },
      _avg: { complianceScore: true },
    });

    const currentScore = Math.round((currentAvg._avg.complianceScore ?? 0) * 10) / 10;

    // Previous month average from audits to compute trend
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);

    const [thisMonthAudits, lastMonthAudits] = await Promise.all([
      prisma.audit.aggregate({
        where: {
          createdAt: { gte: thisMonthStart },
          score: { not: null },
        },
        _avg: { score: true },
      }),
      prisma.audit.aggregate({
        where: {
          createdAt: { gte: lastMonthStart, lt: thisMonthStart },
          score: { not: null },
        },
        _avg: { score: true },
      }),
    ]);

    const thisMonthScore = thisMonthAudits._avg.score;
    const lastMonthScore = lastMonthAudits._avg.score;

    let trend: number | null = null;
    if (thisMonthScore !== null && lastMonthScore !== null) {
      trend = Math.round((thisMonthScore - lastMonthScore) * 10) / 10;
    }

    // Additional context numbers
    const [activeBranches, openIssues, pendingAudits] = await Promise.all([
      prisma.branch.count({ where: { status: 'ACTIVE' } }),
      prisma.issue.count({ where: { status: { in: ['OPEN', 'IN_PROGRESS'] } } }),
      prisma.audit.count({ where: { status: 'UNDER_REVIEW' } }),
    ]);

    return {
      score: currentScore,
      trend,
      activeBranches,
      openIssues,
      pendingAudits,
      dbError: false,
    };
  } catch {
    return {
      score: 0,
      trend: null,
      activeBranches: 0,
      openIssues: 0,
      pendingAudits: 0,
      dbError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Page
// ---------------------------------------------------------------------------

export default async function AnalyticsPage() {
  const session = await getSession();
  if (!session) redirect('/login');

  const health = await getNetworkHealthData();

  return (
    <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
      {health.dbError && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <div>
            <p className="font-bold text-sm">Database Connection Error</p>
            <p className="text-xs">Unable to fetch live analytics data. Some panels may show incomplete information.</p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* Page Header                                                      */}
      {/* ================================================================ */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">
            Intelligence &amp; Analytics
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Anomaly detection, trend analysis, and recurring issue patterns
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-secondary-container/40 px-4 py-2 text-xs font-semibold tracking-wide text-on-surface">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
            auto_awesome
          </span>
          AI-Powered Insights
        </div>
      </header>

      {/* ================================================================ */}
      {/* Network Health Score                                              */}
      {/* ================================================================ */}
      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-4">
        {/* Health Score - Hero Card */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient sm:col-span-2 xl:col-span-1">
          <div className="pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full bg-primary/5 blur-2xl" />
          <div className="relative">
            <div className="mb-4 flex items-center justify-between">
              <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
                  health_and_safety
                </span>
              </span>
              {health.trend !== null && (
                <span
                  className={`flex items-center gap-0.5 rounded-full px-2.5 py-0.5 text-[11px] font-bold ${
                    health.trend >= 0
                      ? 'bg-secondary/10 text-secondary'
                      : 'bg-tertiary/10 text-tertiary'
                  }`}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                    {health.trend >= 0 ? 'arrow_upward' : 'arrow_downward'}
                  </span>
                  {health.trend >= 0 ? '+' : ''}
                  {health.trend}%
                </span>
              )}
            </div>
            <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
              Network Health Score
            </p>
            <p className="text-4xl font-black tracking-tighter text-on-surface">
              {health.score}%
            </p>
            <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
              <div
                className="h-full rounded-full bg-primary transition-all"
                style={{ width: `${health.score}%` }}
              />
            </div>
          </div>
        </div>

        {/* Active Branches */}
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>
                storefront
              </span>
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Active Branches
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {health.activeBranches}
          </p>
        </div>

        {/* Open Issues */}
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 22 }}>
                error_outline
              </span>
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Open Issues
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {health.openIssues}
          </p>
        </div>

        {/* Pending Audits */}
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>
                pending_actions
              </span>
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Pending Audits
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {health.pendingAudits}
          </p>
        </div>
      </section>

      {/* ================================================================ */}
      {/* Main Grid                                                        */}
      {/* ================================================================ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* LEFT 8 COLS */}
        <div className="flex flex-col gap-6 lg:col-span-8">
          {/* Compliance Trends Chart */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-6 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Compliance Trends</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  6-month compliance score and issue volume trend
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                  show_chart
                </span>
              </span>
            </div>
            <ComplianceTrendChart />
          </div>

          {/* Recurring Issues */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Recurring Issue Patterns</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Issue categories appearing repeatedly at branches or across the network
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>
                  repeat
                </span>
              </span>
            </div>
            <RecurringIssuesTable />
          </div>
        </div>

        {/* RIGHT 4 COLS */}
        <div className="flex flex-col gap-6 lg:col-span-4">
          {/* Anomaly Detection */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Anomaly Detection</h2>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">
                  Branches flagged for deviating from norms
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-[#f59e0b]/10">
                <span className="material-symbols-outlined text-[#d97706]" style={{ fontSize: 16 }}>
                  radar
                </span>
              </span>
            </div>
            <AnomalyList />
          </div>

          {/* Detection Legend */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <h2 className="mb-4 text-sm font-bold text-on-surface">Detection Criteria</h2>
            <ul className="space-y-3">
              {[
                {
                  icon: 'trending_down',
                  iconColor: 'text-tertiary',
                  label: 'Low Score',
                  desc: 'Score >1.5 std dev below network average',
                },
                {
                  icon: 'event_busy',
                  iconColor: 'text-[#d97706]',
                  label: 'No Recent Audit',
                  desc: 'No audit completed in the last 30 days',
                },
                {
                  icon: 'arrow_downward',
                  iconColor: 'text-[#ea580c]',
                  label: 'Score Decline',
                  desc: 'Compliance dropped >5 points between audits',
                },
                {
                  icon: 'report',
                  iconColor: 'text-tertiary',
                  label: 'Critical Issues',
                  desc: '3+ open critical/high severity issues',
                },
              ].map((item) => (
                <li key={item.label} className="flex gap-3">
                  <span
                    className={`material-symbols-outlined mt-0.5 flex-shrink-0 ${item.iconColor}`}
                    style={{ fontSize: 16 }}
                  >
                    {item.icon}
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-on-surface">
                      {item.label}
                    </p>
                    <p className="text-[11px] text-on-surface-variant">
                      {item.desc}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}
