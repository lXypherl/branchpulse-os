import prisma from '@/lib/prisma';

async function getData() {
  try {
    const escalations = await prisma.escalation.findMany({
      include: {
        issue: { include: { branch: true } },
        escalatedTo: true,
      },
      orderBy: { triggeredAt: 'desc' },
    });
    return escalations;
  } catch {
    return [];
  }
}

export default async function EscalationsPage() {
  const escalations = await getData();

  const demoEscalations = [
    { id: '1', branch: 'Downtown Seattle #04', issue: 'Health Protocol Violation', level: 3, duration: '48 Hours', assignee: 'Regional Director', status: 'active' },
    { id: '2', branch: 'Miami Beach #12', issue: 'Major Inventory Deficit', level: 2, duration: '24 Hours', assignee: 'Area Manager', status: 'active' },
    { id: '3', branch: 'Boston Hub #02', issue: 'Unresolved SOP Gap', level: 1, duration: '72 Hours', assignee: 'Operations Lead', status: 'active' },
    { id: '4', branch: 'East Ridge Mall', issue: 'Cold Storage Failure', level: 3, duration: '12 Hours', assignee: 'VP Operations', status: 'resolved' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">Escalation Engine</h1>
          <p className="text-on-surface-variant font-medium">Deterministic routing and SLA enforcement for critical operational issues.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-tertiary animate-pulse" />
            <span className="text-xs font-bold text-tertiary uppercase tracking-widest">3 Active Escalations</span>
          </div>
        </div>
      </header>

      {/* SLA Configuration */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
        {[
          { label: 'Critical Response', time: '4 Hours', icon: 'emergency', color: 'tertiary' },
          { label: 'High Priority Response', time: '12 Hours', icon: 'priority_high', color: 'primary-container' },
          { label: 'Standard Response', time: '48 Hours', icon: 'schedule', color: 'primary' },
        ].map((sla) => (
          <div key={sla.label} className="bg-surface-container-lowest p-6 rounded-xl shadow-ambient border border-outline-variant/10">
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg bg-${sla.color}/10`}>
                <span className="material-symbols-outlined text-on-surface-variant">{sla.icon}</span>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-on-surface-variant">{sla.label}</p>
                <p className="text-2xl font-black tracking-tighter text-on-surface">{sla.time}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Escalation Queue */}
      <div className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 overflow-hidden">
        <div className="p-6 border-b border-surface-container-low flex justify-between items-center">
          <h2 className="text-xl font-bold tracking-tight text-on-surface">Active Escalation Queue</h2>
          <span className="text-xs font-bold text-on-surface-variant bg-surface-container px-3 py-1 rounded-full">
            {escalations.length || demoEscalations.length} Items
          </span>
        </div>
        <table className="w-full text-left">
          <thead className="bg-surface-container-low/50">
            <tr>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Branch</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Issue</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Level</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Duration</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Assigned To</th>
              <th className="px-6 py-4 text-[10px] font-black uppercase tracking-widest text-on-surface-variant">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-container-low">
            {demoEscalations.map((esc) => (
              <tr key={esc.id} className="hover:bg-slate-50 transition-colors">
                <td className="px-6 py-4">
                  <p className="font-bold text-sm text-on-surface">{esc.branch}</p>
                </td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-md text-[10px] font-bold ${
                    esc.level >= 3 ? 'bg-error-container text-on-error-container' :
                    esc.level >= 2 ? 'bg-tertiary-fixed text-on-tertiary-fixed-variant' :
                    'bg-surface-variant text-on-surface-variant'
                  }`}>{esc.issue}</span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: esc.level }).map((_, i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-tertiary" />
                    ))}
                    {Array.from({ length: 3 - esc.level }).map((_, i) => (
                      <span key={i} className="w-2 h-2 rounded-full bg-surface-container" />
                    ))}
                  </div>
                </td>
                <td className="px-6 py-4 text-sm font-medium text-on-surface">{esc.duration}</td>
                <td className="px-6 py-4 text-sm text-on-surface-variant">{esc.assignee}</td>
                <td className="px-6 py-4">
                  <button className="text-primary text-xs font-bold hover:underline">Intervene Now</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
