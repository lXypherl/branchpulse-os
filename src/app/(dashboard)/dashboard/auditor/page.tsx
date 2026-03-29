import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { redirect } from 'next/navigation';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// ---------------------------------------------------------------------------
// Data fetching
// ---------------------------------------------------------------------------

async function getAuditorData(userId: string) {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [assignedAudits, completedThisMonth, allMyAudits, myIssues] = await Promise.all([
      prisma.audit.count({
        where: {
          auditorId: userId,
          status: { in: ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW'] },
        },
      }),
      prisma.audit.count({
        where: {
          auditorId: userId,
          status: { in: ['APPROVED', 'CLOSED'] },
          reviewedAt: { gte: startOfMonth },
        },
      }),
      prisma.audit.findMany({
        where: { auditorId: userId },
        include: {
          branch: { select: { name: true, code: true } },
          template: { select: { name: true, category: true } },
        },
        orderBy: { createdAt: 'desc' },
        take: 30,
      }),
      prisma.issue.findMany({
        where: {
          audit: { auditorId: userId },
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
        include: {
          branch: { select: { name: true, code: true } },
        },
        orderBy: [
          { severity: 'asc' },
          { createdAt: 'desc' },
        ],
        take: 20,
      }),
    ]);

    // Calculate average score from completed audits that have scores
    const scoredAudits = allMyAudits.filter((a) => a.score != null);
    const avgScore =
      scoredAudits.length > 0
        ? Math.round((scoredAudits.reduce((sum, a) => sum + (a.score ?? 0), 0) / scoredAudits.length) * 10) / 10
        : 0;

    // Group audits by status
    const pendingAudits = allMyAudits.filter((a) => a.status === 'DRAFT' || a.status === 'SUBMITTED');
    const inReviewAudits = allMyAudits.filter((a) => a.status === 'UNDER_REVIEW');
    const returnedAudits = allMyAudits.filter((a) => a.status === 'RETURNED');
    const completedAudits = allMyAudits.filter((a) => a.status === 'APPROVED' || a.status === 'CLOSED');

    return {
      assignedAudits,
      completedThisMonth,
      avgScore,
      pendingAudits,
      inReviewAudits,
      returnedAudits,
      completedAudits,
      issues: myIssues,
      dbError: false,
    };
  } catch {
    return {
      assignedAudits: 0,
      completedThisMonth: 0,
      avgScore: 0,
      pendingAudits: [],
      inReviewAudits: [],
      returnedAudits: [],
      completedAudits: [],
      issues: [],
      dbError: true,
    };
  }
}

// ---------------------------------------------------------------------------
// Badge helpers
// ---------------------------------------------------------------------------

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

type AuditItem = {
  id: string;
  status: string;
  score: number | null;
  createdAt: Date;
  submittedAt: Date | null;
  branch: { name: string; code: string };
  template: { name: string; category: string };
};

function AuditListSection({
  title,
  icon,
  iconColor,
  audits,
}: {
  title: string;
  icon: string;
  iconColor: string;
  audits: AuditItem[];
}) {
  if (audits.length === 0) return null;

  return (
    <div className="mb-4">
      <div className="mb-3 flex items-center gap-2">
        <span className={`material-symbols-outlined ${iconColor}`} style={{ fontSize: 16 }}>
          {icon}
        </span>
        <h3 className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">
          {title} ({audits.length})
        </h3>
      </div>
      <div className="space-y-2">
        {audits.map((audit) => (
          <Link
            key={audit.id}
            href="/audits"
            className="flex items-center gap-4 rounded-lg border border-outline-variant/10 p-3.5 transition-colors hover:bg-surface-container-low"
          >
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-on-surface truncate hover:text-primary transition-colors">
                {audit.template.name}
              </p>
              <p className="text-[11px] text-on-surface-variant">
                {audit.branch.code} {audit.branch.name} &bull; {audit.template.category}
              </p>
            </div>
            {audit.score != null && (
              <span className={`text-sm font-bold ${audit.score >= 90 ? 'text-secondary' : audit.score >= 75 ? 'text-primary' : 'text-tertiary'}`}>
                {audit.score}%
              </span>
            )}
            <span className={`flex-shrink-0 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${auditStatusBadge(audit.status)}`}>
              {audit.status.replace('_', ' ')}
            </span>
            <span className="flex-shrink-0 text-[10px] text-on-surface-variant/60">
              {new Date(audit.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Page (Server Component)
// ---------------------------------------------------------------------------

export default async function AuditorDashboardPage() {
  const session = await getSession();

  if (!session) redirect('/login');
  if (session.role !== 'FIELD_AUDITOR') {
    return (
      <div className="min-h-screen bg-background px-6 py-8 lg:px-10">
        <div className="mx-auto max-w-lg rounded-xl border border-outline-variant/15 bg-surface-container-lowest p-8 shadow-ambient text-center">
          <span className="material-symbols-outlined text-tertiary mb-3" style={{ fontSize: 48 }}>lock</span>
          <h1 className="text-xl font-bold text-on-surface mb-2">Access Denied</h1>
          <p className="text-sm text-on-surface-variant">
            You don&apos;t have access to this page. This dashboard is for Field Auditors only.
          </p>
        </div>
      </div>
    );
  }

  const data = await getAuditorData(session.id);

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
            My Audit Queue
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            Field auditor dashboard &mdash; {session.name}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-full bg-primary/10 px-4 py-2 text-xs font-semibold tracking-wide text-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>fact_check</span>
          Field Auditor
        </div>
      </header>

      {/* ================================================================ */}
      {/* 2. KPI Row                                                       */}
      {/* ================================================================ */}
      <section className="mb-10 grid grid-cols-1 gap-5 sm:grid-cols-3">
        {/* -- Assigned Audits ------------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>assignment</span>
            </span>
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-[11px] font-bold text-primary">
              Active
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Assigned Audits
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {data.assignedAudits}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-primary/10">
            <div
              className="h-full rounded-full bg-primary transition-all"
              style={{ width: `${Math.min((data.assignedAudits / 10) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* -- Completed This Month -------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-secondary/10">
              <span className="material-symbols-outlined text-secondary" style={{ fontSize: 22 }}>task_alt</span>
            </span>
            <span className="rounded-full bg-secondary/10 px-2.5 py-0.5 text-[11px] font-bold text-secondary">
              This Month
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Completed This Month
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {data.completedThisMonth}
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-secondary/10">
            <div
              className="h-full rounded-full bg-secondary transition-all"
              style={{ width: `${Math.min((data.completedThisMonth / 15) * 100, 100)}%` }}
            />
          </div>
        </div>

        {/* -- Average Score --------------------------------------------- */}
        <div className="relative overflow-hidden rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
          <div className="mb-4 flex items-center justify-between">
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-tertiary/10">
              <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 22 }}>analytics</span>
            </span>
            <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-bold ${data.avgScore >= 90 ? 'bg-secondary/10 text-secondary' : data.avgScore >= 75 ? 'bg-primary/10 text-primary' : 'bg-tertiary/10 text-tertiary'}`}>
              {data.avgScore >= 90 ? 'Excellent' : data.avgScore >= 75 ? 'Good' : 'Needs Work'}
            </span>
          </div>
          <p className="mb-0.5 text-[10px] font-semibold uppercase tracking-wider text-on-surface-variant">
            Average Score
          </p>
          <p className="text-4xl font-black tracking-tighter text-on-surface">
            {data.avgScore}%
          </p>
          <div className="mt-4 h-1.5 w-full overflow-hidden rounded-full bg-tertiary/10">
            <div
              className={`h-full rounded-full transition-all ${data.avgScore >= 90 ? 'bg-secondary' : data.avgScore >= 75 ? 'bg-primary' : 'bg-tertiary'}`}
              style={{ width: `${data.avgScore}%` }}
            />
          </div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. Main Grid                                                     */}
      {/* ================================================================ */}
      <section className="grid grid-cols-1 gap-6 lg:grid-cols-12">
        {/* ============================================================ */}
        {/* LEFT 8 COLS - Audit List                                     */}
        {/* ============================================================ */}
        <div className="lg:col-span-8">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-on-surface">My Audits</h2>
                <p className="mt-0.5 text-xs text-on-surface-variant">
                  All audits assigned to you, grouped by status
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>checklist</span>
              </span>
            </div>

            {/* Returned (needs attention first) */}
            <AuditListSection
              title="Returned - Action Required"
              icon="undo"
              iconColor="text-tertiary"
              audits={data.returnedAudits}
            />

            {/* Pending / In Progress */}
            <AuditListSection
              title="Pending Submission"
              icon="edit_note"
              iconColor="text-primary"
              audits={data.pendingAudits}
            />

            {/* Under Review */}
            <AuditListSection
              title="Under Review"
              icon="hourglass_top"
              iconColor="text-primary"
              audits={data.inReviewAudits}
            />

            {/* Completed */}
            <AuditListSection
              title="Completed"
              icon="check_circle"
              iconColor="text-secondary"
              audits={data.completedAudits}
            />

            {data.pendingAudits.length === 0 &&
             data.inReviewAudits.length === 0 &&
             data.returnedAudits.length === 0 &&
             data.completedAudits.length === 0 && (
              <div className="py-8 text-center text-sm text-on-surface-variant">
                <span className="material-symbols-outlined mb-2 block text-on-surface-variant" style={{ fontSize: 32 }}>assignment</span>
                No audits assigned to you yet.
              </div>
            )}
          </div>
        </div>

        {/* ============================================================ */}
        {/* RIGHT 4 COLS - Issues from My Audits                        */}
        {/* ============================================================ */}
        <div className="lg:col-span-4">
          <div className="rounded-xl border border-outline-variant/10 bg-surface-container-lowest p-6 shadow-ambient">
            <div className="mb-5 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-on-surface">Issues from My Audits</h2>
                <p className="mt-0.5 text-[10px] text-on-surface-variant">
                  Open issues raised from your audits
                </p>
              </div>
              <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-tertiary/10">
                <span className="material-symbols-outlined text-tertiary" style={{ fontSize: 16 }}>bug_report</span>
              </span>
            </div>

            <div className="space-y-3">
              {data.issues.map((issue) => (
                <Link
                  key={issue.id}
                  href="/issues"
                  className="block rounded-lg border border-outline-variant/10 p-3 transition-colors hover:bg-surface-container-low"
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex h-5 w-5 flex-shrink-0 items-center justify-center rounded ${severityBadge(issue.severity)}`}>
                      <span className="material-symbols-outlined" style={{ fontSize: 12 }}>
                        {issue.severity === 'CRITICAL' ? 'warning' : issue.severity === 'HIGH' ? 'error_outline' : 'info'}
                      </span>
                    </span>
                    <p className="text-xs font-semibold text-on-surface truncate hover:text-primary transition-colors">{issue.title}</p>
                  </div>
                  <p className="text-[10px] text-on-surface-variant ml-7">
                    {issue.branch.code} {issue.branch.name}
                  </p>
                  <div className="flex items-center gap-2 mt-1.5 ml-7">
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-bold ${severityBadge(issue.severity)}`}>
                      {issue.severity}
                    </span>
                    <span className={`inline-block rounded-full px-2 py-0.5 text-[9px] font-semibold ${issue.status === 'OPEN' ? 'bg-tertiary/10 text-tertiary' : 'bg-primary/10 text-primary'}`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </div>
                </Link>
              ))}
              {data.issues.length === 0 && (
                <div className="py-6 text-center text-xs text-on-surface-variant">
                  <span className="material-symbols-outlined mb-2 block text-secondary" style={{ fontSize: 28 }}>check_circle</span>
                  No open issues from your audits.
                </div>
              )}
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
