import prisma from '@/lib/prisma';
import Link from 'next/link';
import LiveTriagePanel from '@/components/issues/LiveTriagePanel';

export const dynamic = 'force-dynamic';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface DemoIssue {
  id: string;
  code: string;
  title: string;
  description: string;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  status: string;
  category: string;
  branchName: string;
  reportedByName: string;
  reportedByAvatar: string | null;
  assignedToName: string | null;
  assignedToAvatar: string | null;
  auditName: string | null;
  correctiveAction: string | null;
  evidenceUrls: string[];
  dueDate: Date | null;
  createdAt: Date;
}

/* -------------------------------------------------------------------------- */
/*  Demo fallback data                                                        */
/* -------------------------------------------------------------------------- */

const DEMO_ISSUES: DemoIssue[] = [
  {
    id: '1',
    code: 'BP-77402',
    title: 'Cold Storage Temperature Deviation (Zone 4)',
    description:
      'Temperature readings from Zone 4 cold storage unit exceeded safe thresholds (>8 C) for a continuous 45-minute window during peak inventory intake. Automated sensors triggered at 14:17. Potential spoilage risk for perishable SKUs in racks C4-C9.',
    severity: 'CRITICAL',
    status: 'OPEN',
    category: 'Safety',
    branchName: 'Downtown Flagship',
    reportedByName: 'Sarah Kessler',
    reportedByAvatar: null,
    assignedToName: 'Marcus Thorne',
    assignedToAvatar: null,
    auditName: 'Weekly Safety Compliance #402',
    correctiveAction:
      'Isolate affected cold storage unit and transfer perishable inventory to backup Zone 2 unit. Dispatch refrigeration technician for emergency coil inspection. Log temperature readings every 15 minutes until resolution.',
    evidenceUrls: [],
    dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  },
  {
    id: '2',
    code: 'BP-77398',
    title: 'Unsecured Inventory Dock #12',
    description:
      'Dock #12 loading bay door found ajar during non-operational hours. Security camera footage shows door was left open after last delivery at 22:45.',
    severity: 'HIGH',
    status: 'IN_PROGRESS',
    category: 'Security',
    branchName: 'Westside Logistics',
    reportedByName: 'James Okoye',
    reportedByAvatar: null,
    assignedToName: 'Dana Rivera',
    assignedToAvatar: null,
    auditName: 'Security Sweep #189',
    correctiveAction:
      'Install auto-locking mechanism on Dock #12. Retrain overnight logistics crew on lock-up procedures.',
    evidenceUrls: [],
    dueDate: new Date(Date.now() + 2 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000),
  },
  {
    id: '3',
    code: 'BP-77385',
    title: 'SOP Manual Outdated (Section 4.2)',
    description:
      'Section 4.2 of the Standard Operating Procedures manual references superseded health & safety guidelines from 2024. Update required to align with 2026 regional compliance standards.',
    severity: 'MEDIUM',
    status: 'OPEN',
    category: 'Compliance',
    branchName: 'East Branch Hub',
    reportedByName: 'Li Wei',
    reportedByAvatar: null,
    assignedToName: null,
    assignedToAvatar: null,
    auditName: 'Quarterly Compliance Review #88',
    correctiveAction: null,
    evidenceUrls: [],
    dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
  },
  {
    id: '4',
    code: 'BP-77370',
    title: 'Signage Damage: Entrance A',
    description:
      'Main entrance illuminated signage panel is cracked. Cosmetic issue, no safety risk. Replacement panel on order.',
    severity: 'LOW',
    status: 'IN_PROGRESS',
    category: 'Facilities',
    branchName: 'Mall Outlet North',
    reportedByName: 'Priya Nair',
    reportedByAvatar: null,
    assignedToName: 'Facilities Team',
    assignedToAvatar: null,
    auditName: null,
    correctiveAction: 'Order replacement signage panel. ETA 5 business days.',
    evidenceUrls: [],
    dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
  },
  {
    id: '5',
    code: 'BP-77362',
    title: 'Fire Extinguisher Inspection Overdue (Aisle 7)',
    description: 'Fire extinguisher in Aisle 7 has not been inspected within the required 30-day cycle.',
    severity: 'HIGH',
    status: 'OPEN',
    category: 'Safety',
    branchName: 'Northgate Superstore',
    reportedByName: 'Sarah Kessler',
    reportedByAvatar: null,
    assignedToName: 'Marcus Thorne',
    assignedToAvatar: null,
    auditName: 'Weekly Safety Compliance #401',
    correctiveAction: null,
    evidenceUrls: [],
    dueDate: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
  },
  {
    id: '6',
    code: 'BP-77355',
    title: 'Staff Certification Lapse: Food Handling',
    description: 'Two staff members in the deli section have expired food handling certificates.',
    severity: 'MEDIUM',
    status: 'OPEN',
    category: 'Compliance',
    branchName: 'Harbor District Branch',
    reportedByName: 'James Okoye',
    reportedByAvatar: null,
    assignedToName: null,
    assignedToAvatar: null,
    auditName: 'Monthly Compliance #76',
    correctiveAction: null,
    evidenceUrls: [],
    dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000),
  },
];

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function severityBorder(severity: string): string {
  switch (severity) {
    case 'CRITICAL':
      return 'border-tertiary';
    case 'HIGH':
      return 'border-orange-500';
    case 'MEDIUM':
      return 'border-primary';
    case 'LOW':
      return 'border-secondary';
    default:
      return 'border-outline-variant';
  }
}

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

function relativeTime(date: Date): string {
  const now = Date.now();
  const diff = now - new Date(date).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return 'Just now';
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function dueLabel(dueDate: Date | null): { text: string; urgent: boolean } | null {
  if (!dueDate) return null;
  const now = Date.now();
  const diff = new Date(dueDate).getTime() - now;
  const hours = Math.round(diff / (1000 * 60 * 60));
  if (hours < 0) {
    const overdueDays = Math.abs(Math.floor(hours / 24));
    return {
      text: overdueDays > 0 ? `${overdueDays} days overdue` : `${Math.abs(hours)}h overdue`,
      urgent: true,
    };
  }
  if (hours < 48) return { text: `Due in ${hours}h`, urgent: false };
  const days = Math.floor(hours / 24);
  return { text: `Due in ${days}d`, urgent: false };
}

/* -------------------------------------------------------------------------- */
/*  Data fetching                                                             */
/* -------------------------------------------------------------------------- */

async function getIssues(): Promise<DemoIssue[]> {
  try {
    const issues = await prisma.issue.findMany({
      include: { branch: true, reportedBy: true, assignedTo: true, audit: true },
      orderBy: [{ severity: 'asc' }, { createdAt: 'desc' }],
    });

    return issues.map((issue, idx) => ({
      id: issue.id,
      code: `BP-${(77402 - idx).toString()}`,
      title: issue.title,
      description: issue.description,
      severity: issue.severity as DemoIssue['severity'],
      status: issue.status,
      category: issue.category,
      branchName: issue.branch.name,
      reportedByName: issue.reportedBy.name,
      reportedByAvatar: issue.reportedBy.avatarUrl,
      assignedToName: issue.assignedTo?.name ?? null,
      assignedToAvatar: issue.assignedTo?.avatarUrl ?? null,
      auditName: issue.audit?.id ? `Audit #${issue.audit.id.slice(-4)}` : null,
      correctiveAction: issue.correctiveAction ?? null,
      evidenceUrls: issue.evidenceUrls,
      dueDate: issue.dueDate,
      createdAt: issue.createdAt,
    }));
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Page                                                                      */
/* -------------------------------------------------------------------------- */

export default async function IssuesPage() {
  const issues = await getIssues();
  const criticalCount = issues.filter((i) => i.severity === 'CRITICAL').length;
  const featured = issues[0];

  return (
    <div className="space-y-10">
      {/* ------------------------------------------------------------------ */}
      {/*  Page Header                                                       */}
      {/* ------------------------------------------------------------------ */}
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tighter text-on-surface">
            Issue Tracking
          </h1>
          <p className="mt-1 text-on-surface-variant">
            Resolution workflows for identified non-compliance across 24 active
            branches.
          </p>
        </div>

        <div className="flex items-center gap-3">
          {/* Critical Alerts badge */}
          <span className="inline-flex items-center gap-2 rounded-full bg-tertiary/10 px-4 py-2 text-sm font-semibold text-tertiary">
            <span className="relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-tertiary opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-tertiary" />
            </span>
            {criticalCount} Critical Alert{criticalCount !== 1 ? 's' : ''}
          </span>

          {/* Active filter badge */}
          <span className="inline-flex items-center gap-1.5 rounded-full bg-surface-container px-4 py-2 text-sm font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Active Filters: All Branches
          </span>
        </div>
      </header>

      {/* ------------------------------------------------------------------ */}
      {/*  Main Grid                                                         */}
      {/* ------------------------------------------------------------------ */}
      <div className="grid grid-cols-12 gap-8">
        {/* ================================================================ */}
        {/*  LEFT: Issue Feed (4 cols)                                       */}
        {/* ================================================================ */}
        <aside className="col-span-12 xl:col-span-4">
          <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-ambient">
            {/* Feed header */}
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-bold text-on-surface">Issue Feed</h2>
              <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                {issues.length > 6 ? issues.length : 82} Total
              </span>
            </div>

            {/* Scrollable card list */}
            <div className="max-h-[800px] space-y-3 overflow-y-auto pr-1">
              {issues.map((issue) => {
                const due = dueLabel(issue.dueDate);
                return (
                  <Link key={issue.id} href={`/issues/${issue.id}`} className="block">
                    <div
                      className={`cursor-pointer rounded-xl border-l-4 bg-surface-container-lowest p-4 shadow-ambient transition hover:translate-x-1 ${severityBorder(issue.severity)}`}
                    >
                      {/* Severity + Status */}
                      <div className="mb-2 flex items-center gap-2">
                        <span
                          className={`rounded-md px-2 py-0.5 text-[11px] font-bold uppercase tracking-wide ${severityBadgeCls(issue.severity)}`}
                        >
                          {issue.severity}
                        </span>
                        <span className="rounded-md bg-surface-container px-2 py-0.5 text-[11px] font-medium text-on-surface-variant">
                          {issue.status.replace('_', ' ')}
                        </span>
                      </div>

                      {/* Title */}
                      <h3 className="text-sm font-semibold leading-snug text-on-surface">
                        {issue.title}
                      </h3>

                      {/* Meta */}
                      <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-on-surface-variant">
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">location_on</span>
                          {issue.branchName}
                        </span>
                        <span className="inline-flex items-center gap-1">
                          <span className="material-symbols-outlined text-[16px]">history</span>
                          {relativeTime(issue.createdAt)}
                        </span>
                        {due && (
                          <span
                            className={`font-semibold ${due.urgent ? 'text-tertiary' : 'text-on-surface-variant'}`}
                          >
                            {due.text}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>
          </div>
        </aside>

        {/* ================================================================ */}
        {/*  CENTER: Issue Detail Panel (5 cols)                             */}
        {/* ================================================================ */}
        <section className="col-span-12 xl:col-span-5">
          {featured && (
            <div className="rounded-[32px] bg-surface-container-lowest p-10 shadow-ambient-lg">
              {/* Top bar */}
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-lg bg-primary/10 px-3 py-1 text-xs font-bold uppercase tracking-widest text-primary">
                  {featured.code}
                </span>
                <div className="flex gap-2">
                  <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-[20px]">share</span>
                  </button>
                  <button className="flex h-9 w-9 items-center justify-center rounded-xl bg-surface-container text-on-surface-variant transition hover:bg-surface-container-high">
                    <span className="material-symbols-outlined text-[20px]">more_horiz</span>
                  </button>
                </div>
              </div>

              {/* Severity badge */}
              <span
                className={`mb-4 inline-block rounded-md px-2.5 py-1 text-xs font-bold uppercase tracking-wide ${severityBadgeCls(featured.severity)}`}
              >
                {featured.severity}
              </span>

              {/* Title */}
              <h2 className="text-3xl font-black leading-tight tracking-tight text-on-surface">
                {featured.title}
              </h2>

              {/* Description */}
              <p className="mt-3 text-sm leading-relaxed text-on-surface-variant">
                {featured.description}
              </p>

              {/* Origin Audit + Accountability grid */}
              <div className="mt-8 grid grid-cols-2 gap-6">
                {/* Origin Audit */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
                    Origin Audit
                  </span>
                  <p className="mt-1 text-sm font-medium text-on-surface">
                    {featured.auditName ?? 'N/A'}
                  </p>
                </div>

                {/* Accountability */}
                <div>
                  <span className="text-xs font-semibold uppercase tracking-wider text-on-surface-variant/60">
                    Accountability
                  </span>
                  <div className="mt-1 flex items-center gap-2">
                    {/* Avatar placeholder */}
                    <div className="flex h-7 w-7 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary">
                      {featured.assignedToName
                        ? featured.assignedToName
                            .split(' ')
                            .map((n) => n[0])
                            .join('')
                        : '?'}
                    </div>
                    <p className="text-sm font-medium text-on-surface">
                      {featured.assignedToName ?? 'Unassigned'}
                      {featured.assignedToName && (
                        <span className="block text-xs font-normal text-on-surface-variant">
                          Branch Mgr
                        </span>
                      )}
                    </p>
                  </div>
                </div>
              </div>

              {/* Corrective Action Plan */}
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-on-surface">
                  Corrective Action Plan
                </h3>
                <div className="rounded-2xl border border-outline-variant/40 bg-surface-container-low p-5">
                  <p className="text-sm leading-relaxed text-on-surface-variant">
                    {featured.correctiveAction ??
                      'No corrective action has been defined for this issue yet.'}
                  </p>
                </div>
              </div>

              {/* Visual Evidence */}
              <div className="mt-8">
                <h3 className="mb-3 text-sm font-bold uppercase tracking-wider text-on-surface">
                  Visual Evidence
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-200">
                    <span className="material-symbols-outlined text-3xl text-slate-400">
                      image
                    </span>
                  </div>
                  <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-200">
                    <span className="material-symbols-outlined text-3xl text-slate-400">
                      image
                    </span>
                  </div>
                </div>
              </div>

              {/* Verify & Close button */}
              <button className="mt-8 w-full rounded-2xl bg-primary py-4 text-sm font-bold text-on-primary shadow-ambient transition hover:opacity-90">
                Verify &amp; Close Issue
              </button>
            </div>
          )}
        </section>

        {/* ================================================================ */}
        {/*  RIGHT: Side Panels (3 cols)                                     */}
        {/* ================================================================ */}
        <aside className="col-span-12 xl:col-span-3 space-y-6">
          {/* -------------------------------------------------------------- */}
          {/*  Escalation Rules                                              */}
          {/* -------------------------------------------------------------- */}
          <div className="rounded-[24px] bg-surface-container p-6">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-on-surface">
              Escalation Rules
            </h3>

            <div className="space-y-4">
              {/* Rule: SLA Breach - checked */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-tertiary text-white">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">SLA Breach</p>
                  <p className="text-xs text-on-surface-variant">
                    Auto-escalate when response time exceeds SLA threshold.
                  </p>
                </div>
              </div>

              {/* Rule: Safety Hazard - checked */}
              <div className="flex items-start gap-3">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md bg-tertiary text-white">
                  <span className="material-symbols-outlined text-[16px]">check</span>
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Safety Hazard</p>
                  <p className="text-xs text-on-surface-variant">
                    Immediate escalation for any safety-related findings.
                  </p>
                </div>
              </div>

              {/* Rule: Repeat Failure - unchecked */}
              <div className="flex items-start gap-3 opacity-40">
                <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-md border border-outline-variant bg-surface-container-lowest">
                  &nbsp;
                </span>
                <div>
                  <p className="text-sm font-semibold text-on-surface">Repeat Failure</p>
                  <p className="text-xs text-on-surface-variant">
                    Trigger on 3+ recurring issues at the same branch.
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* -------------------------------------------------------------- */}
          {/*  AI Triage Assistant (Live)                                    */}
          {/* -------------------------------------------------------------- */}
          {featured && (
            <LiveTriagePanel
              issueId={featured.id}
              title={featured.title}
              description={featured.description ?? ''}
              currentSeverity={featured.severity}
              currentCategory={featured.category}
            />
          )}

          {/* -------------------------------------------------------------- */}
          {/*  Compliance Log                                                */}
          {/* -------------------------------------------------------------- */}
          <div className="rounded-[24px] bg-surface-container-lowest p-6 shadow-ambient">
            <h3 className="mb-5 text-sm font-bold uppercase tracking-wider text-on-surface">
              Compliance Log
            </h3>

            <div className="relative space-y-6 pl-5">
              {/* Vertical timeline line */}
              <div className="absolute left-[7px] top-1 h-[calc(100%-8px)] w-px bg-outline-variant/50" />

              {/* Entry 1: Action Logged */}
              <div className="relative">
                <span className="absolute -left-5 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-primary bg-surface-container-lowest" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary">
                    Action Logged
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-on-surface">
                    Technician Arrival
                  </p>
                  <p className="text-xs text-on-surface-variant">Today at 14:02</p>
                </div>
              </div>

              {/* Entry 2: Escalation Triggered */}
              <div className="relative">
                <span className="absolute -left-5 top-1 flex h-3.5 w-3.5 items-center justify-center rounded-full border-2 border-tertiary bg-surface-container-lowest" />
                <div>
                  <span className="text-xs font-bold uppercase tracking-wider text-tertiary">
                    Escalation Triggered
                  </span>
                  <p className="mt-0.5 text-sm font-medium text-on-surface">
                    System-wide alert dispatched
                  </p>
                  <p className="text-xs text-on-surface-variant">Today at 14:22</p>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>
    </div>
  );
}
