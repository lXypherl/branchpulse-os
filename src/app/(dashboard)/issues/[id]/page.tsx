import prisma from '@/lib/prisma';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import IssueActions from './IssueActions';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function severityBadgeCls(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'bg-tertiary/10 text-tertiary';
    case 'HIGH':
      return 'bg-orange-50 text-orange-700';
    case 'MEDIUM':
      return 'bg-primary/10 text-primary';
    case 'LOW':
      return 'bg-secondary/10 text-secondary';
    default:
      return 'bg-surface-container text-on-surface-variant';
  }
}

function statusBadgeCls(status: string): string {
  switch (status) {
    case 'OPEN':
      return 'bg-tertiary/10 text-tertiary';
    case 'IN_PROGRESS':
      return 'bg-primary/10 text-primary';
    case 'UNDER_REVIEW':
      return 'bg-amber-50 text-amber-700';
    case 'RESOLVED':
      return 'bg-emerald-50 text-emerald-700';
    case 'CLOSED':
      return 'bg-slate-50 text-slate-500';
    default:
      return 'bg-surface-container text-on-surface-variant';
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

function formatShortDate(date: Date) {
  return new Date(date).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function IssueDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  let issue;
  try {
    issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        branch: true,
        reportedBy: true,
        assignedTo: true,
        audit: {
          include: {
            template: { select: { name: true, category: true } },
          },
        },
        escalations: {
          include: {
            escalatedTo: { select: { name: true, role: true } },
          },
          orderBy: { triggeredAt: 'asc' },
        },
      },
    });
  } catch {
    issue = null;
  }

  if (!issue) notFound();

  return (
    <div className="space-y-8">
      {/* ------------------------------------------------------------------ */}
      {/*  Back Link + Breadcrumb                                            */}
      {/* ------------------------------------------------------------------ */}
      <div>
        <Link
          href="/issues"
          className="inline-flex items-center gap-1.5 text-sm font-medium text-on-surface-variant hover:text-primary transition-colors"
        >
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Back to Issues
        </Link>
        <nav className="mt-2 flex items-center gap-1.5 text-xs text-on-surface-variant">
          <Link href="/issues" className="hover:text-primary transition-colors">Issues</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="font-semibold text-on-surface truncate">{issue.title}</span>
        </nav>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Header                                                            */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-3 mb-3">
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wide ${severityBadgeCls(issue.severity)}`}>
              {issue.severity}
            </span>
            <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${statusBadgeCls(issue.status)}`}>
              {issue.status.replace('_', ' ')}
            </span>
            <span className="text-xs text-on-surface-variant">
              {issue.category}
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            {issue.title}
          </h1>
          <p className="mt-1 text-xs text-on-surface-variant">
            Created {formatDate(issue.createdAt)}
            {issue.dueDate && (
              <>
                {' '}&mdash; Due {formatShortDate(issue.dueDate)}
              </>
            )}
          </p>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Main Grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-6">
        {/* ============================================================== */}
        {/*  LEFT 8 COLS                                                   */}
        {/* ============================================================== */}
        <div className="col-span-12 xl:col-span-8 space-y-6">
          {/* Description */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Description
            </h2>
            <p className="text-sm leading-relaxed text-on-surface whitespace-pre-wrap">
              {issue.description}
            </p>
          </div>

          {/* Corrective Action */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Corrective Action Plan
            </h2>
            {issue.correctiveAction ? (
              <div className="rounded-xl border border-outline-variant/40 bg-surface-container-low p-5">
                <p className="text-sm leading-relaxed text-on-surface-variant">
                  {issue.correctiveAction}
                </p>
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic py-4 text-center">
                No corrective action has been defined for this issue yet.
              </p>
            )}
          </div>

          {/* Evidence */}
          {issue.evidenceUrls.length > 0 && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
                Evidence ({issue.evidenceUrls.length})
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {issue.evidenceUrls.map((url, idx) => (
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

          {/* Escalation History Timeline */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-4">
              Escalation History
            </h2>

            {issue.escalations.length > 0 ? (
              <div className="relative space-y-6 pl-5">
                {/* Vertical timeline line */}
                <div className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-px bg-outline-variant/50" />

                {issue.escalations.map((esc, idx) => (
                  <div key={esc.id} className="relative">
                    <span className={`absolute -left-5 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 ${
                      esc.resolvedAt
                        ? 'border-secondary bg-secondary-container'
                        : 'border-tertiary bg-tertiary-fixed'
                    }`} />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs font-bold uppercase tracking-wider ${
                          esc.resolvedAt ? 'text-secondary' : 'text-tertiary'
                        }`}>
                          Level {esc.level} Escalation
                        </span>
                        {esc.resolvedAt && (
                          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                            Resolved
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm font-medium text-on-surface">
                        {esc.reason}
                      </p>
                      <p className="text-xs text-on-surface-variant mt-1">
                        Escalated to {esc.escalatedTo.name} ({esc.escalatedTo.role.replace('_', ' ')})
                      </p>
                      <p className="text-[10px] text-on-surface-variant/60 mt-0.5">
                        {formatDate(esc.triggeredAt)}
                        {esc.resolvedAt && ` \u2014 Resolved ${formatDate(esc.resolvedAt)}`}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-on-surface-variant italic py-4 text-center">
                No escalations for this issue.
              </p>
            )}
          </div>
        </div>

        {/* ============================================================== */}
        {/*  RIGHT 4 COLS                                                  */}
        {/* ============================================================== */}
        <div className="col-span-12 xl:col-span-4 space-y-6">
          {/* Issue Meta */}
          <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6 space-y-4">
            <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant">
              Issue Details
            </h2>

            <div>
              <p className="text-xs text-on-surface-variant">Branch</p>
              <Link href="/branches" className="text-sm font-semibold text-on-surface hover:text-primary hover:underline transition-colors mt-0.5 block">
                {issue.branch.name}
              </Link>
              <p className="text-xs text-on-surface-variant">{issue.branch.code} &bull; {issue.branch.address}</p>
            </div>

            <div>
              <p className="text-xs text-on-surface-variant">Reported By</p>
              <div className="flex items-center gap-2 mt-1">
                <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-blue-100 text-blue-700 text-[10px] font-bold">
                  {issue.reportedBy.name.split(' ').map((w) => w[0]).join('').toUpperCase()}
                </span>
                <p className="text-sm font-semibold text-on-surface">{issue.reportedBy.name}</p>
              </div>
            </div>

            <div>
              <p className="text-xs text-on-surface-variant">Assigned To</p>
              {issue.assignedTo ? (
                <div className="flex items-center gap-2 mt-1">
                  <span className="inline-flex items-center justify-center w-7 h-7 rounded-full bg-purple-100 text-purple-700 text-[10px] font-bold">
                    {issue.assignedTo.name.split(' ').map((w) => w[0]).join('').toUpperCase()}
                  </span>
                  <p className="text-sm font-semibold text-on-surface">{issue.assignedTo.name}</p>
                </div>
              ) : (
                <p className="text-sm text-on-surface-variant italic mt-0.5">Unassigned</p>
              )}
            </div>

            <div>
              <p className="text-xs text-on-surface-variant">Severity</p>
              <span className={`inline-flex items-center mt-1 rounded-full px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wide ${severityBadgeCls(issue.severity)}`}>
                {issue.severity}
              </span>
            </div>

            <div>
              <p className="text-xs text-on-surface-variant">Category</p>
              <p className="text-sm font-medium text-on-surface mt-0.5">{issue.category}</p>
            </div>

            {issue.dueDate && (
              <div>
                <p className="text-xs text-on-surface-variant">Due Date</p>
                <p className={`text-sm font-medium mt-0.5 ${
                  new Date(issue.dueDate).getTime() < Date.now() ? 'text-tertiary' : 'text-on-surface'
                }`}>
                  {formatShortDate(issue.dueDate)}
                  {new Date(issue.dueDate).getTime() < Date.now() && ' (Overdue)'}
                </p>
              </div>
            )}

            <div>
              <p className="text-xs text-on-surface-variant">Last Updated</p>
              <p className="text-sm text-on-surface mt-0.5">{formatDate(issue.updatedAt)}</p>
            </div>
          </div>

          {/* Related Audit */}
          {issue.audit && (
            <div className="bg-surface-container-lowest rounded-2xl border border-outline-variant/15 shadow-sm p-6">
              <h2 className="text-sm font-bold uppercase tracking-wider text-on-surface-variant mb-3">
                Related Audit
              </h2>
              <Link
                href={`/audits/${issue.audit.id}`}
                className="block rounded-xl border border-outline-variant/10 p-4 transition-colors hover:bg-surface-container-low"
              >
                <p className="text-sm font-semibold text-on-surface hover:text-primary transition-colors">
                  {issue.audit.template.name}
                </p>
                <p className="text-xs text-on-surface-variant mt-0.5">
                  {issue.audit.template.category}
                </p>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                    issue.audit.status === 'APPROVED' || issue.audit.status === 'CLOSED'
                      ? 'bg-emerald-50 text-emerald-700'
                      : issue.audit.status === 'RETURNED'
                      ? 'bg-red-50 text-red-700'
                      : 'bg-blue-50 text-blue-700'
                  }`}>
                    {issue.audit.status.replace('_', ' ')}
                  </span>
                  {issue.audit.score != null && (
                    <span className={`text-xs font-bold ${
                      issue.audit.score >= 90 ? 'text-emerald-600' :
                      issue.audit.score >= 70 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {issue.audit.score}%
                    </span>
                  )}
                </div>
              </Link>
            </div>
          )}

          {/* Action Buttons */}
          <IssueActions issueId={issue.id} currentStatus={issue.status} hasCorrectiveAction={!!issue.correctiveAction} />
        </div>
      </div>
    </div>
  );
}
