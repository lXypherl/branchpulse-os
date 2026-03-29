import prisma from '@/lib/prisma';

/* -------------------------------------------------------------------------- */
/*  Types                                                                     */
/* -------------------------------------------------------------------------- */

interface BranchRow {
  id: string;
  name: string;
  address: string;
  status: 'ACTIVE' | 'MAINTENANCE' | 'INACTIVE';
  complianceScore: number;
  lastAuditDate: string | null;
  operatingHours: string | null;
  managerName: string | null;
  managerEmail: string | null;
  areaName: string;
  regionName: string;
}

interface AuditEntry {
  date: string;
  score: number;
  passed: boolean;
}

interface IssueEntry {
  id: string;
  title: string;
  severity: string;
  icon: string;
}

/* -------------------------------------------------------------------------- */
/*  Fallback demo data                                                        */
/* -------------------------------------------------------------------------- */

const FALLBACK_BRANCHES: BranchRow[] = [
  {
    id: '1',
    name: 'Lexington Ave (Flagship)',
    address: '750 Lexington Ave, New York, NY 10022',
    status: 'ACTIVE',
    complianceScore: 98.4,
    lastAuditDate: '2025-10-12',
    operatingHours: 'Mon-Fri 7:00 AM - 9:00 PM',
    managerName: 'Elena Rodriguez',
    managerEmail: 'e.rodriguez@branchpulse.io',
    areaName: 'NYC Area',
    regionName: 'Northeast',
  },
  {
    id: '2',
    name: 'Chelsea Market Hub',
    address: '75 9th Ave, New York, NY 10011',
    status: 'ACTIVE',
    complianceScore: 92.1,
    lastAuditDate: '2025-10-08',
    operatingHours: 'Mon-Sat 8:00 AM - 8:00 PM',
    managerName: 'Marcus Chen',
    managerEmail: 'm.chen@branchpulse.io',
    areaName: 'NYC Area',
    regionName: 'Northeast',
  },
  {
    id: '3',
    name: 'Times Square North',
    address: '1560 Broadway, New York, NY 10036',
    status: 'MAINTENANCE',
    complianceScore: 74.5,
    lastAuditDate: '2025-09-28',
    operatingHours: 'Mon-Sun 6:00 AM - 11:00 PM',
    managerName: 'Sarah Jenkins',
    managerEmail: 's.jenkins@branchpulse.io',
    areaName: 'NYC Area',
    regionName: 'Northeast',
  },
  {
    id: '4',
    name: 'SoHo Boutique Br.',
    address: '112 Prince St, New York, NY 10012',
    status: 'ACTIVE',
    complianceScore: 88.9,
    lastAuditDate: '2025-10-01',
    operatingHours: 'Mon-Sat 9:00 AM - 7:00 PM',
    managerName: 'David Miller',
    managerEmail: 'd.miller@branchpulse.io',
    areaName: 'NYC Area',
    regionName: 'Northeast',
  },
];

const FALLBACK_ISSUES: IssueEntry[] = [
  {
    id: '1',
    title: 'Fire suppression cert. expired',
    severity: 'HIGH',
    icon: 'local_fire_department',
  },
  {
    id: '2',
    title: 'POS terminal firmware outdated',
    severity: 'HIGH',
    icon: 'point_of_sale',
  },
  {
    id: '3',
    title: 'Staff hygiene training overdue',
    severity: 'MEDIUM',
    icon: 'health_and_safety',
  },
];

const FALLBACK_AUDITS: AuditEntry[] = [
  { date: 'Oct 12, 2025', score: 98.4, passed: true },
  { date: 'Jul 18, 2025', score: 95.1, passed: true },
  { date: 'Apr 05, 2025', score: 91.7, passed: true },
  { date: 'Jan 22, 2025', score: 78.3, passed: false },
];

/* -------------------------------------------------------------------------- */
/*  Data fetching                                                             */
/* -------------------------------------------------------------------------- */

async function getBranches(): Promise<BranchRow[]> {
  try {
    const branches = await prisma.branch.findMany({
      include: { area: { include: { region: true } }, manager: true },
      orderBy: { complianceScore: 'desc' },
    });

    return branches.map((b) => ({
      id: b.id,
      name: b.name,
      address: b.address,
      status: b.status as BranchRow['status'],
      complianceScore: b.complianceScore,
      lastAuditDate: b.lastAuditDate ? b.lastAuditDate.toISOString().split('T')[0] : null,
      operatingHours: b.operatingHours,
      managerName: b.manager?.name ?? null,
      managerEmail: b.manager?.email ?? null,
      areaName: b.area.name,
      regionName: b.area.region.name,
    }));
  } catch {
    return [];
  }
}

/* -------------------------------------------------------------------------- */
/*  Helpers                                                                   */
/* -------------------------------------------------------------------------- */

function formatAuditDate(iso: string | null): string {
  if (!iso) return '\u2014';
  const d = new Date(iso);
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function scoreColor(score: number): string {
  if (score >= 90) return 'text-secondary';
  if (score >= 80) return 'text-on-surface';
  return 'text-tertiary';
}

/* -------------------------------------------------------------------------- */
/*  Page component                                                            */
/* -------------------------------------------------------------------------- */

export default async function BranchRegistryPage() {
  const branches = await getBranches();
  const totalCount = branches.length;
  const displayCount = Math.min(totalCount, 10);

  /* Pick the first branch as the "selected" detail target */
  const selected = branches[0] ?? null;

  return (
    <div className="space-y-6">
      {branches.length === 0 && (
        <div className="p-4 bg-error-container text-on-error-container rounded-xl flex items-center gap-3">
          <span className="material-symbols-outlined">error</span>
          <div>
            <p className="font-bold text-sm">Unable to load branch data</p>
            <p className="text-xs">Database connection failed. Please check your database configuration.</p>
          </div>
        </div>
      )}
      {/* ------------------------------------------------------------------ */}
      {/*  Page Header                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          {/* Breadcrumb */}
          <nav className="flex items-center gap-1.5 text-xs text-on-surface-variant mb-2">
            <span>North America</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span>Northeast</span>
            <span className="material-symbols-outlined text-[14px]">chevron_right</span>
            <span className="font-semibold text-on-surface">NYC Area</span>
          </nav>

          {/* Title */}
          <h1 className="text-3xl font-extrabold tracking-tight text-on-surface">
            Branch Registry
          </h1>

          {/* Subtitle */}
          <p className="mt-1 text-sm text-on-surface-variant">
            Managing {totalCount} locations across Manhattan and surrounding boroughs.
          </p>
        </div>

        {/* Action buttons */}
        <div className="flex items-center gap-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-surface-container-highest px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filter
          </button>
          <button className="inline-flex items-center gap-2 rounded-xl bg-surface-container-highest px-4 py-2.5 text-sm font-medium text-on-surface transition-colors hover:bg-surface-container-high">
            <span className="material-symbols-outlined text-[18px]">download</span>
            Export
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/*  Main layout                                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex gap-8">
        {/* -------------------------------------------------------------- */}
        {/*  Left: Branch Table                                             */}
        {/* -------------------------------------------------------------- */}
        <div className="min-w-0 flex-1">
          <div className="bg-surface-container-lowest rounded-xl shadow-ambient overflow-hidden">
            {/* Table */}
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-outline-variant/30">
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Branch Name
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Manager
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Status
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Score
                  </th>
                  <th className="px-5 py-4 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                    Last Audit
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-outline-variant/20">
                {branches.slice(0, displayCount).map((branch, idx) => {
                  const isSelected = idx === 0;
                  return (
                    <tr
                      key={branch.id}
                      className={`
                        transition-colors duration-150
                        ${
                          isSelected
                            ? 'bg-primary/5 border-l-4 border-primary'
                            : 'border-l-4 border-transparent hover:bg-surface-container-low/30 cursor-pointer'
                        }
                      `}
                    >
                      {/* Branch name + address */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div
                            className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                              branch.status === 'ACTIVE'
                                ? 'bg-secondary-container/40 text-secondary'
                                : 'bg-tertiary-fixed/40 text-tertiary'
                            }`}
                          >
                            <span className="material-symbols-outlined text-[18px]">
                              location_on
                            </span>
                          </div>
                          <div>
                            <p className="text-sm font-bold text-on-surface">{branch.name}</p>
                            <p className="text-xs text-on-surface-variant">{branch.address}</p>
                          </div>
                        </div>
                      </td>

                      {/* Manager */}
                      <td className="px-5 py-4 text-sm text-on-surface">
                        {branch.managerName ?? '\u2014'}
                      </td>

                      {/* Status badge */}
                      <td className="px-5 py-4">
                        {branch.status === 'ACTIVE' ? (
                          <span className="inline-flex items-center rounded-full bg-secondary-container/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-secondary">
                            Active
                          </span>
                        ) : branch.status === 'MAINTENANCE' ? (
                          <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-tertiary">
                            Maintenance
                          </span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-surface-container px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wide text-on-surface-variant">
                            Inactive
                          </span>
                        )}
                      </td>

                      {/* Compliance score */}
                      <td className={`px-5 py-4 text-sm font-bold ${scoreColor(branch.complianceScore)}`}>
                        {branch.complianceScore.toFixed(1)}%
                      </td>

                      {/* Last audit */}
                      <td className="px-5 py-4 text-sm text-on-surface-variant">
                        {formatAuditDate(branch.lastAuditDate)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-outline-variant/20 px-5 py-3">
              <p className="text-xs text-on-surface-variant">
                Showing {displayCount} of {totalCount} branches
              </p>
              <div className="flex items-center gap-1">
                <button className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[18px]">chevron_left</span>
                </button>
                <button className="rounded-lg p-1.5 text-on-surface-variant transition-colors hover:bg-surface-container-low">
                  <span className="material-symbols-outlined text-[18px]">chevron_right</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* -------------------------------------------------------------- */}
        {/*  Right: Branch Detail Panel                                     */}
        {/* -------------------------------------------------------------- */}
        {selected && <aside className="hidden w-96 shrink-0 lg:block">
          <div className="sticky top-28 space-y-5">
            {/* ---------------------------------------------------------- */}
            {/*  1. Branch Header Card                                      */}
            {/* ---------------------------------------------------------- */}
            <div className="overflow-hidden rounded-xl bg-surface-container-lowest shadow-ambient">
              {/* Gradient strip */}
              <div className="relative h-28 bg-gradient-to-br from-primary to-primary-container">
                {/* Overlapping store icon */}
                <div className="absolute -bottom-5 left-5 flex h-14 w-14 items-center justify-center rounded-xl bg-white shadow-ambient-lg">
                  <span className="material-symbols-outlined filled-icon text-primary text-[28px]">
                    storefront
                  </span>
                </div>
              </div>

              <div className="px-5 pb-5 pt-8">
                <h2 className="text-lg font-extrabold tracking-tight text-on-surface">
                  {selected.name}
                </h2>

                {/* Location */}
                <div className="mt-2 flex items-start gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px] mt-0.5">pin_drop</span>
                  <span>{selected.address}</span>
                </div>

                {/* Operating hours */}
                <div className="mt-1.5 flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">schedule</span>
                  <span>{selected.operatingHours ?? 'Hours not specified'}</span>
                </div>

                {/* Manager email */}
                <div className="mt-1.5 flex items-center gap-2 text-sm text-on-surface-variant">
                  <span className="material-symbols-outlined text-[16px]">mail</span>
                  <span>{selected.managerEmail ?? 'No contact on file'}</span>
                </div>
              </div>
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  2. Active Issues Card                                      */}
            {/* ---------------------------------------------------------- */}
            <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-on-surface">Active Issues</h3>
                <span className="inline-flex items-center rounded-full bg-tertiary-fixed px-2.5 py-0.5 text-[11px] font-semibold text-tertiary">
                  2 High Priority
                </span>
              </div>

              <ul className="mt-4 space-y-3">
                {FALLBACK_ISSUES.map((issue) => (
                  <li key={issue.id} className="flex items-start gap-3">
                    <div
                      className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                        issue.severity === 'HIGH'
                          ? 'bg-tertiary-fixed/50 text-tertiary'
                          : 'bg-surface-container text-on-surface-variant'
                      }`}
                    >
                      <span className="material-symbols-outlined text-[16px]">{issue.icon}</span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-on-surface">{issue.title}</p>
                      <p className="text-[11px] uppercase tracking-wide text-on-surface-variant">
                        {issue.severity}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>

              <button className="mt-4 w-full rounded-xl border border-outline-variant/40 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/5">
                View All Tickets
              </button>
            </div>

            {/* ---------------------------------------------------------- */}
            {/*  3. Audit History Card                                      */}
            {/* ---------------------------------------------------------- */}
            <div className="rounded-xl bg-surface-container-lowest p-5 shadow-ambient">
              <h3 className="text-sm font-bold text-on-surface">Audit History</h3>

              <ol className="mt-4 space-y-0">
                {FALLBACK_AUDITS.map((audit, idx) => (
                  <li key={idx} className="relative flex gap-4 pb-5 last:pb-0">
                    {/* Timeline connector line */}
                    {idx < FALLBACK_AUDITS.length - 1 && (
                      <div className="absolute left-[7px] top-4 h-full w-px bg-outline-variant/30" />
                    )}

                    {/* Dot */}
                    <div
                      className={`relative z-10 mt-1 h-4 w-4 shrink-0 rounded-full border-2 ${
                        audit.passed
                          ? 'border-secondary bg-secondary-container'
                          : 'border-tertiary bg-tertiary-fixed'
                      }`}
                    />

                    {/* Content */}
                    <div className="flex-1">
                      <div className="flex items-baseline justify-between">
                        <p className="text-sm font-semibold text-on-surface">{audit.date}</p>
                        <p className={`text-sm font-bold ${audit.passed ? 'text-secondary' : 'text-tertiary'}`}>
                          {audit.score.toFixed(1)}%
                        </p>
                      </div>
                      <p className="text-xs text-on-surface-variant">
                        {audit.passed ? 'Passed compliance review' : 'Below threshold \u2014 corrective action filed'}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </div>
        </aside>}
      </div>
    </div>
  );
}
