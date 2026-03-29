import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import AuditActions from './AuditActions';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

const statusConfig: Record<string, { label: string; bg: string; text: string }> = {
  DRAFT: { label: 'Draft', bg: 'bg-slate-50', text: 'text-slate-600' },
  SUBMITTED: { label: 'Submitted', bg: 'bg-blue-50', text: 'text-blue-700' },
  UNDER_REVIEW: { label: 'Under Review', bg: 'bg-amber-50', text: 'text-amber-700' },
  APPROVED: { label: 'Approved', bg: 'bg-emerald-50', text: 'text-emerald-700' },
  RETURNED: { label: 'Returned', bg: 'bg-red-50', text: 'text-red-700' },
  CLOSED: { label: 'Closed', bg: 'bg-slate-50', text: 'text-slate-500' },
};

function scoreColor(score: number) {
  if (score >= 90) return 'text-emerald-600';
  if (score >= 70) return 'text-amber-600';
  return 'text-red-600';
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

function formatDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function AuditDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let audit;
  try {
    audit = await prisma.audit.findUnique({
      where: { id },
      include: {
        branch: true,
        template: true,
        auditor: true,
        reviewer: true,
        issues: {
          include: {
            assignedTo: { select: { name: true } },
          },
          orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
        },
      },
    });
  } catch {
    audit = null;
  }

  if (!audit) notFound();

  const status = statusConfig[audit.status] ?? statusConfig.DRAFT;

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/*  Back Link + Breadcrumb                                            */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <Link
          href="/audits"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Audits
        </Link>
        <nav className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link href="/audits" className="hover:text-primary transition-colors">Audits</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-on-surface">{audit.template.name}</span>
        </nav>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Header                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${status.bg} ${status.text}`}>
              {status.label}
            </span>
            <span className="text-xs text-on-surface-variant">
              ID: {audit.id.slice(-8).toUpperCase()}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            {audit.template.name}
          </h1>
          <p className="mt-1 text-sm text-on-surface-variant">
            {audit.template.category} &mdash; {audit.template.description ?? 'No description'}
          </p>
        </div>

        {/* Score */}
        {audit.score != null && (
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-20 h-20 rounded-2xl bg-surface-container-lowest border border-outline-variant/15 shadow-sm">
              <span className={`text-3xl font-extrabold ${scoreColor(audit.score)}`}>
                {audit.score}
              </span>
            </div>
            <div>
              <p className="text-sm font-semibold text-on-surface">Audit Score</p>
              <p className={`text-xs font-medium ${scoreColor(audit.score)}`}>
                {audit.score >= 90 ? 'Excellent' : audit.score >= 70 ? 'Satisfactory' : 'Needs Improvement'}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Main Grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/*  LEFT 8 COLS                                                   */}
        {/* ============================================================== */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Branch Info */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Branch Information
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-on-surface-variant">Branch Name</p>
                <Link href="/branches" className="text-sm font-semibold text-on-surface hover:text-primary hover:underline transition-colors">
                  {audit.branch.name}
                </Link>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Branch Code</p>
                <p className="text-sm font-semibold text-on-surface">{audit.branch.code}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Address</p>
                <p className="text-sm text-on-surface">{audit.branch.address}</p>
              </div>
              <div>
                <p className="text-xs text-on-surface-variant">Branch Status</p>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${
                  audit.branch.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' :
                  audit.branch.status === 'MAINTENANCE' ? 'bg-amber-50 text-amber-700' :
                  'bg-slate-50 text-slate-600'
                }`}>
                  {audit.branch.status}
                </span>
              </div>
            </div>
          </div>

          {/* Findings */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Findings
            </h2>
            {audit.findings ? (
              <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
                {audit.findings}
              </p>
            ) : (
              <p className="text-sm text-on-surface-variant italic">
                No findings recorded for this audit.
              </p>
            )}
          </div>

          {/* Evidence Gallery */}
          {audit.evidenceUrls.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
                Evidence ({audit.evidenceUrls.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {audit.evidenceUrls.map((url, idx) => (
                  <a
                    key={idx}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group relative aspect-video rounded-xl bg-slate-100 overflow-hidden cursor-pointer border border-outline-variant/10"
                  >
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="material-symbols-outlined text-slate-300 text-[32px]">image</span>
                    </div>
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="material-symbols-outlined text-white text-[20px]">zoom_in</span>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Issues Raised */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
                Issues Raised ({audit.issues.length})
              </h2>
              {audit.issues.length > 0 && (
                <Link href="/issues" className="text-xs font-medium text-primary hover:underline transition-colors">
                  View All Issues
                </Link>
              )}
            </div>

            {audit.issues.length > 0 ? (
              <div className="space-y-3">
                {audit.issues.map((issue) => (
                  <Link
                    key={issue.id}
                    href={`/issues/${issue.id}`}
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
                      </p>
                    </div>
                    <span className={`flex-shrink-0 inline-block rounded-full px-2.5 py-1 text-[10px] font-semibold ${
                      issue.status === 'OPEN' ? 'bg-tertiary/10 text-tertiary' :
                      issue.status === 'IN_PROGRESS' ? 'bg-primary/10 text-primary' :
                      'bg-secondary/10 text-secondary'
                    }`}>
                      {issue.status.replace('_', ' ')}
                    </span>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic py-4 text-center">
                No issues raised from this audit.
              </p>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/*  RIGHT 4 COLS                                                  */}
        {/* ============================================================== */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Audit Meta */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Audit Details
            </h2>

            <div>
              <p className="text-xs text-on-surface-variant">Auditor</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {audit.auditor.name.split(' ').map((w) => w[0]).join('').toUpperCase()}
                </span>
                <p className="text-sm font-semibold text-on-surface">{audit.auditor.name}</p>
              </div>
            </div>

            {audit.reviewer && (
              <div>
                <p className="text-xs text-on-surface-variant">Reviewer</p>
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                    {audit.reviewer.name.split(' ').map((w) => w[0]).join('').toUpperCase()}
                  </span>
                  <p className="text-sm font-semibold text-on-surface">{audit.reviewer.name}</p>
                </div>
              </div>
            )}

            <div>
              <p className="text-xs text-on-surface-variant">Created</p>
              <p className="text-sm text-on-surface mt-0.5">{formatDate(audit.createdAt)}</p>
            </div>

            {audit.submittedAt && (
              <div>
                <p className="text-xs text-on-surface-variant">Submitted</p>
                <p className="text-sm text-on-surface mt-0.5">{formatDate(audit.submittedAt)}</p>
              </div>
            )}

            {audit.reviewedAt && (
              <div>
                <p className="text-xs text-on-surface-variant">Reviewed</p>
                <p className="text-sm text-on-surface mt-0.5">{formatDate(audit.reviewedAt)}</p>
              </div>
            )}

            <div>
              <p className="text-xs text-on-surface-variant">Template</p>
              <p className="text-sm font-medium text-on-surface mt-0.5">{audit.template.name}</p>
              <p className="text-xs text-on-surface-variant">{audit.template.category}</p>
            </div>
          </div>

          {/* Action Buttons */}
          <AuditActions auditId={audit.id} currentStatus={audit.status} />
        </div>
      </div>
    </div>
  );
}
