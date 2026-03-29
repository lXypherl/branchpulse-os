import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getBranchData(branchId: string) {
  try {
    const [branch, recentAudits, openIssues, stockRequests, promoChecks] = await Promise.all([
      prisma.branch.findUnique({
        where: { id: branchId },
        include: {
          area: { select: { name: true, region: { select: { name: true } } } },
          manager: { select: { name: true } },
        },
      }),
      prisma.audit.findMany({
        where: { branchId },
        include: {
          template: { select: { name: true, category: true } },
          auditor: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.issue.findMany({
        where: {
          branchId,
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
        include: {
          assignedTo: { select: { name: true } },
          reportedBy: { select: { name: true } },
        },
        orderBy: [
          { severity: 'asc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.stockRequest.findMany({
        where: { branchId },
        include: {
          requestedBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.promoCheck.findMany({
        where: { branchId },
        orderBy: { dueDate: 'desc' },
        take: 10,
      }),
    ]);

    return {
      branch,
      recentAudits,
      openIssues,
      stockRequests,
      promoChecks,
      dbError: false,
    };
  } catch {
    return {
      branch: null,
      recentAudits: [],
      openIssues: [],
      stockRequests: [],
      promoChecks: [],
      dbError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

function severityBadge(severity: string) {
  switch (severity) {
    case 'CRITICAL':
    case 'HIGH':
      return 'bg-tertiary/10 text-tertiary';
    case 'MEDIUM':
      return 'bg-primary/10 text-primary';
    default:
      return 'bg-secondary/10 text-secondary';
  }
}

function auditStatusBadge(status: string) {
  switch (status) {
    case 'APPROVED':
    case 'CLOSED':
      return 'bg-secondary/10 text-secondary';
    case 'UNDER_REVIEW':
    case 'SUBMITTED':
      return 'bg-primary/10 text-primary';
    case 'RETURNED':
      return 'bg-tertiary/10 text-tertiary';
    default:
      return 'bg-outline-variant/20 text-on-surface-variant';
  }
}

function stockStatusBadge(status: string) {
  switch (status) {
    case 'FULFILLED':
    case 'APPROVED':
      return 'bg-secondary/10 text-secondary';
    case 'PENDING':
      return 'bg-primary/10 text-primary';
    case 'REJECTED':
      return 'bg-tertiary/10 text-tertiary';
    default:
      return 'bg-outline-variant/20 text-on-surface-variant';
  }
}

function promoStatusBadge(status: string) {
  switch (status) {
    case 'CONFIRMED':
      return 'bg-secondary/10 text-secondary';
    case 'PENDING':
      return 'bg-primary/10 text-primary';
    case 'FAILED':
      return 'bg-tertiary/10 text-tertiary';
    default:
      return 'bg-outline-variant/20 text-on-surface-variant';
  }
}

function branchStatusBadge(status: string) {
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

export default async function BranchDashboardPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role !== 'BRANCH_MANAGER') {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-lg rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-ambient text-center">
          <span className="material-symbols-outlined text-tertiary mb-3" style={{ fontSize: 48 }}>lock</span>
          <h1 className="text-xl font-bold text-on-surface mb-2">Access Denied</h1>
          <p className="text-sm text-on-surface-variant">
            You don&apos;t have access to this page. This dashboard is for Branch Managers only.
          </p>
        </div>
      </div>
    );
  }

  if (!session.branchId) {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-lg rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-ambient text-center">
          <span className="material-symbols-outlined text-primary mb-3" style={{ fontSize: 48 }}>settings</span>
          <h1 className="text-xl font-bold text-on-surface mb-2">Account Misconfigured</h1>
          <p className="text-sm text-on-surface-variant">
            Your account is not linked to a branch. Please contact your administrator.
          </p>
        </div>
      </div>
    );
  }

  const data = await getBranchData(session.branchId);

  if (!data.branch) {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mb-6 p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <div>
            <p className="font-bold text-sm">Branch Not Found</p>
            <p className="text-xs">Unable to load branch data. Please contact your administrator.</p>
          </div>
        </div>
      </div>
    );
  }

  const { branch, recentAudits, openIssues, stockRequests, promoChecks } = data;

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
            {branch.name}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {branch.code} &mdash; {branch.address}
          </p>
          <p className="mt-0.5 text-xs text-on-surface-variant">
            {branch.area.region.name} &bull; {branch.area.name}
            {branch.manager ? ` \u2022 Managed by ${branch.manager.name}` : ''}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <span className={`inline-block rounded-full px-3 py-1.5 text-xs font-semibold ${branchStatusBadge(branch.status)}`}>
            {branch.status}
          </span>
          <div className="flex items-center gap-2 rounded-full bg-secondary/10 px-4 py-2 text-xs font-semibold tracking-wide text-secondary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>store</span>
            Branch Manager
          </div>
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. Compliance Score (large display)                              */}
      {/* ================================================================ */}
      <section className="mb-10">
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-8 shadow-ambient">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>verified</span>
                </span>
                <div>
                  <p className="text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
                    Branch Compliance Score
                  </p>
                  <p className="text-xs text-on-surface-variant">
                    Last audit: {branch.lastAuditDate
                      ? new Date(branch.lastAuditDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                      : 'Never audited'}
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right">
              <p className={`text-6xl font-black tracking-tighter ${branch.complianceScore >= 90 ? 'text-secondary' : branch.complianceScore >= 75 ? 'text-primary' : 'text-tertiary'}`}>
                {branch.complianceScore}%
              </p>
            </div>
          </div>
          <div className="mt-6 h-2 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className={`h-full rounded-full transition-all ${branch.complianceScore >= 90 ? 'bg-secondary' : branch.complianceScore >= 75 ? 'bg-primary' : 'bg-tertiary'}`}
              style={{ width: `${branch.complianceScore}%` }}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. Main Grid                                                     */}
      {/* ================================================================ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ============================================================ */}
        {/* LEFT 7 COLS                                                  */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-6 lg:col-span-7">
          {/* ---------------------------------------------------------- */}
          {/* Recent Audits                                                */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Recent Audits</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  Last {recentAudits.length} audits for this branch
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>assignment</span>
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-outline-variant/20">
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Audit</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Auditor</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Status</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Score</th>
                    <th className="pb-3 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-outline-variant/10">
                  {recentAudits.map((audit) => (
                    <tr key={audit.id} className="group">
                      <td className="py-3.5">
                        <div>
                          <p className="text-sm font-medium text-on-surface">{audit.template.name}</p>
                          <p className="text-[11px] text-on-surface-variant">{audit.template.category}</p>
                        </div>
                      </td>
                      <td className="py-3.5 text-xs text-on-surface-variant">{audit.auditor.name}</td>
                      <td className="py-3.5">
                        <span className={`inline-block rounded-full px-2.5 py-1 text-[11px] font-semibold ${auditStatusBadge(audit.status)}`}>
                          {audit.status.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-3.5">
                        {audit.score != null ? (
                          <span className={`text-sm font-bold ${audit.score >= 90 ? 'text-secondary' : audit.score >= 75 ? 'text-primary' : 'text-tertiary'}`}>
                            {audit.score}%
                          </span>
                        ) : (
                          <span className="text-xs text-on-surface-variant">&mdash;</span>
                        )}
                      </td>
                      <td className="py-3.5 text-xs text-on-surface-variant">
                        {new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                    </tr>
                  ))}
                  {recentAudits.length === 0 && (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-sm text-on-surface-variant">
                        No audits recorded for this branch yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Open Issues                                                  */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">Open Issues</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  {openIssues.length} issue{openIssues.length !== 1 ? 's' : ''} requiring attention
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>priority_high</span>
              </span>
            </div>

            <div className="space-y-3">
              {openIssues.map((issue) => (
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
                      <p className="text-sm font-semibold text-on-surface truncate">{issue.title}</p>
                      <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-bold ${severityBadge(issue.severity)}`}>
                        {issue.severity}
                      </span>
                    </div>
                    <p className="text-[11px] text-on-surface-variant">
                      {issue.category}
                      {issue.assignedTo ? ` \u2022 Assigned to ${issue.assignedTo.name}` : ' \u2022 Unassigned'}
                      {issue.dueDate ? ` \u2022 Due ${new Date(issue.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}` : ''}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${issue.status === 'OPEN' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                    {issue.status.replace('_', ' ')}
                  </span>
                </div>
              ))}
              {openIssues.length === 0 && (
                <div className="py-8 text-center text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined mb-2 block text-secondary" style={{ fontSize: 32 }}>check_circle</span>
                  No open issues for this branch. Great work!
                </div>
              )}
            </div>
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT 5 COLS                                                 */}
        {/* ============================================================ */}
        <div className="flex flex-col gap-6 lg:col-span-5">
          {/* ---------------------------------------------------------- */}
          {/* Stock Requests                                               */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Stock Requests</h2>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">
                  Recent stock requests
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>inventory_2</span>
              </span>
            </div>

            <div className="space-y-3">
              {stockRequests.map((sr) => {
                const items = sr.items as { name?: string; quantity?: number }[] | null;
                const itemSummary = Array.isArray(items)
                  ? items.map((i) => `${i.name ?? 'Item'}${i.quantity ? ` x${i.quantity}` : ''}`).join(', ')
                  : 'Items requested';

                return (
                  <div key={sr.id} className="flex items-start gap-3 rounded-lg border border-outline-variant/10 p-3">
                    <span className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${stockStatusBadge(sr.status)}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                        {sr.status === 'FULFILLED' ? 'check_circle' : sr.status === 'PENDING' ? 'schedule' : sr.status === 'APPROVED' ? 'thumb_up' : 'cancel'}
                      </span>
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-xs font-semibold text-on-surface truncate">{itemSummary}</p>
                      <p className="text-[10px] text-on-surface-variant">
                        {sr.requestedBy.name} &bull; {new Date(sr.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </p>
                    </div>
                    <span className={`flex-shrink-0 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${stockStatusBadge(sr.status)}`}>
                      {sr.status}
                    </span>
                  </div>
                );
              })}
              {stockRequests.length === 0 && (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No stock requests.
                </div>
              )}
            </div>
          </div>

          {/* ---------------------------------------------------------- */}
          {/* Promo Checks                                                 */}
          {/* ---------------------------------------------------------- */}
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Promo Check Status</h2>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">
                  Promotional compliance checks
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-secondary/10">
                <span className="material-symbols-outlined text-secondary" style={{ fontSize: 16 }}>campaign</span>
              </span>
            </div>

            <div className="space-y-3">
              {promoChecks.map((pc) => (
                <div key={pc.id} className="flex items-start gap-3 rounded-lg border border-outline-variant/10 p-3">
                  <span className={`inline-flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg ${promoStatusBadge(pc.status)}`}>
                    <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                      {pc.status === 'CONFIRMED' ? 'check_circle' : pc.status === 'PENDING' ? 'schedule' : 'cancel'}
                    </span>
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-semibold text-on-surface truncate">{pc.name}</p>
                    <p className="text-[10px] text-on-surface-variant">
                      {pc.dueDate
                        ? `Due ${new Date(pc.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : 'No due date'}
                      {pc.completedAt
                        ? ` \u2022 Completed ${new Date(pc.completedAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`
                        : ''}
                    </p>
                  </div>
                  <span className={`flex-shrink-0 inline-block rounded-full px-2 py-0.5 text-[10px] font-semibold ${promoStatusBadge(pc.status)}`}>
                    {pc.status}
                  </span>
                </div>
              ))}
              {promoChecks.length === 0 && (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  No promo checks scheduled.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
