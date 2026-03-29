import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getRegionalData(userId: string, regionId: string) {
  try {
    const [region, branches, activeAudits, openIssues] = await Promise.all([
      prisma.region.findUnique({ where: { id: regionId }, select: { name: true } }),
      prisma.branch.findMany({
        where: { area: { regionId } },
        include: {
          manager: { select: { name: true } },
          area: { select: { name: true } },
        },
        orderBy: { complianceScore: 'desc' },
      }),
      prisma.audit.count({
        where: {
          branch: { area: { regionId } },
          status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.issue.findMany({
        where: {
          branch: { area: { regionId } },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
        include: {
          branch: { select: { name: true, code: true } },
          assignedTo: { select: { name: true } },
        },
        orderBy: [
          { severity: 'asc' }, // CRITICAL first (alphabetical: CRITICAL < HIGH < LOW < MEDIUM)
          { createdAt: 'desc' },
        ],
        take: 20,
      }),
    ]);

    const branchCount = branches.length;
    const avgCompliance =
      branchCount > 0
        ? Math.round((branches.reduce((sum, b) => sum + b.complianceScore, 0) / branchCount) * 10) / 10
        : 0;

    return {
      regionName: region?.name ?? 'Unknown Region',
      branchCount,
      avgCompliance,
      activeAudits,
      openIssueCount: openIssues.length,
      branches,
      issues: openIssues,
      dbError: false,
    };
  } catch {
    return {
      regionName: 'Unknown',
      branchCount: 0,
      avgCompliance: 0,
      activeAudits: 0,
      openIssueCount: 0,
      branches: [],
      issues: [],
      dbError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Severity helpers
// ---------------------------------------------------------------------------

const severityOrder: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };

function severityBadge(severity: string) {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-tertiary/10 text-tertiary';
    case 'HIGH':
      return 'bg-tertiary/10 text-tertiary';
    case 'MEDIUM':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-secondary/10 text-secondary';
  }
}

function statusBadge(status: string) {
  switch (status) {
    case 'ACTIVE':
      return 'bg-secondary/10 text-secondary';
    case 'MAINTENANCE':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-outline-variant/20 text-on-surface-variant';
  }
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function RegionalDashboardPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role !== 'REGIONAL_MANAGER') {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-lg rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-ambient text-center">
          <span className="material-symbols-outlined text-tertiary mb-3" style={{ fontSize: 48 }}>lock</span>
          <h1 className="text-xl font-bold text-on-surface mb-2">Access Denied</h1>
          <p className="text-sm text-on-surface-variant">
            You don&apos;t have access to this page. This dashboard is for Regional Managers only.
          </p>
        </div>
      </div>
    );
  }

  if (!session.regionId) {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-lg rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-ambient text-center">
          <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: 48 }}>settings</span>
          <h1 className="text-xl font-bold text-on-surface mb-2">Account Misconfigured</h1>
          <p className="text-sm text-on-surface-variant">
            Your account is not linked to a region. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const data = await getRegionalData(session.id, session.regionId);

  return (
    <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
      {/* Error banner */}
      {data.dbError && (
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <div>
            <p className="font-bold text-sm">Database Connection Error</p>
            <p className="text-xs">Unable to fetch live data. The values shown below may be incomplete.</p>
          </div>
        </div>
      )}

      {/* ================================================================ */}
      {/* 1. Page Header                                                   */}
      {/* ================================================================ */}
      <header className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-on-surface">
            {data.regionName}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Regional overview &mdash; {data.branchCount} Branches across your region
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold tracking-wide text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>map</span>
          Regional Manager
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. KPI Row                                                       */}
      {/* ================================================================ */}
      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* -- Regional Compliance Score --------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>verified</span>
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              Region Avg
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Regional Compliance Score
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {data.avgCompliance}%
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${data.avgCompliance}%` }}
            />
          </div>
        </div>

        {/* -- Active Audits --------------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>assignment</span>
            </span>
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-secondary">
              In Progress
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Active Audits
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {data.activeAudits}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary/10">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${Math.min((data.activeAudits / 20) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* -- Open Issues ----------------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 22 }}>error_outline</span>
            </span>
            <span className="rounded-full bg-tertiary/10 px-2.5 py-0.5 text-[11px] font-bold text-tertiary">
              Needs Attention
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Open Issues
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {data.openIssueCount}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-tertiary/10">
            <div
              className="h-full rounded-full bg-tertiary transition-all"
              style={{ width: `${Math.min((data.openIssueCount / 15) * 100, 100)}%` }}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. Branch Table                                                  */}
      {/* ================================================================ */}
      <section className="mb-10">
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Branches in Region</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                {data.branchCount} branches sorted by compliance score
              </p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>store</span>
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-outline-variant/20">
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Branch</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Area</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Manager</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Compliance</th>
                  <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Last Audit</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/10">
                {data.branches.map((branch) => (
                  <tr key={branch.id} className="group">
                    <td className="py-3.5">
                      <div>
                        <Link href="/branches" className="text-sm font-medium text-on-surface hover:text-primary hover:underline transition-colors">
                          {branch.name}
                        </Link>
                        <p className="text-[11px] text-on-surface-variant">{branch.code}</p>
                      </div>
                    </td>
                    <td className="py-3.5 text-xs text-on-surface-variant">{branch.area.name}</td>
                    <td className="py-3.5 text-xs text-on-surface-variant">{branch.manager?.name ?? 'Unassigned'}</td>
                    <td className="py-3.5">
                      <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${statusBadge(branch.status)}`}>
                        {branch.status}
                      </span>
                    </td>
                    <td className="py-3.5">
                      <span className={`text-sm font-bold ${branch.complianceScore >= 90 ? 'text-secondary' : branch.complianceScore >= 75 ? 'text-primary' : 'text-tertiary'}`}>
                        {branch.complianceScore}%
                      </span>
                    </td>
                    <td className="py-3.5 text-xs text-on-surface-variant">
                      {branch.lastAuditDate
                        ? new Date(branch.lastAuditDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
                        : 'Never'}
                    </td>
                  </tr>
                ))}
                {data.branches.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-sm text-on-surface-variant">
                      No branches found in this region.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. Issues List                                                   */}
      {/* ================================================================ */}
      <section>
        <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-5 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-on-surface">Regional Issues</h2>
              <p className="mt-0.5 text-xs text-on-surface-variant">
                Open issues sorted by severity
              </p>
            </div>
            <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-tertiary/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>priority_high</span>
            </span>
          </div>

          <div className="space-y-3">
            {data.issues.map((issue) => (
              <div
                key={issue.id}
                className="flex items-start gap-4 rounded-lg border border-outline-variant/10 p-4 transition-colors hover:bg-surface-container-low"
              >
                <span className={`inline-flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${severityBadge(issue.severity)}`}>
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {issue.severity === 'CRITICAL' ? 'warning' : issue.severity === 'HIGH' ? 'error_outline' : 'info'}
                  </span>
                </span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <Link href="/issues" className="text-sm font-semibold text-on-surface truncate hover:text-primary hover:underline transition-colors">
                      {issue.title}
                    </Link>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${severityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                  </div>
                  <p className="text-[11px] text-on-surface-variant">
                    {issue.branch.code} {issue.branch.name}
                    {issue.assignedTo ? ` \u2022 Assigned to ${issue.assignedTo.name}` : ' \u2022 Unassigned'}
                  </p>
                </div>
                <span className={`flex-shrink-0 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${issue.status === 'OPEN' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                  {issue.status.replace('_', ' ')}
                </span>
              </div>
            ))}
            {data.issues.length === 0 && (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 block text-secondary" style={{ fontSize: 32 }}>check_circle</span>
                No open issues in your region. Great work!
              </div>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
