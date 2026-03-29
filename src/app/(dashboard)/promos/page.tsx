import prisma from '@/lib/prisma';

async function getData() {
  try {
    const promos = await prisma.promoCheck.findMany({
      include: { branch: true },
      orderBy: { dueDate: 'asc' },
    });
    return promos;
  } catch {
    return [];
  }
}

export default async function PromosPage() {
  await getData();

  const demoCampaigns = [
    { id: '1', name: 'Summer Safety First', status: 'active', branches: 42, confirmed: 38, failed: 1, pending: 3, dueDate: 'Apr 5, 2026' },
    { id: '2', name: 'Q1 Inventory Blitz', status: 'completed', branches: 42, confirmed: 42, failed: 0, pending: 0, dueDate: 'Mar 15, 2026' },
    { id: '3', name: 'Spring Menu Rollout', status: 'active', branches: 42, confirmed: 29, failed: 2, pending: 11, dueDate: 'Apr 1, 2026' },
  ];

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">Promo Execution Checks</h1>
          <p className="text-on-surface-variant font-medium">Validate campaign rollout quality across all branch locations.</p>
        </div>
        <button className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Campaign
        </button>
      </header>

      <div className="space-y-6">
        {demoCampaigns.map((campaign) => (
          <div key={campaign.id} className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 p-8">
            <div className="flex items-start justify-between mb-6">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <h2 className="text-xl font-bold tracking-tight text-on-surface">{campaign.name}</h2>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase ${
                    campaign.status === 'active' ? 'bg-blue-100 text-blue-700' : 'bg-emerald-100 text-emerald-700'
                  }`}>{campaign.status}</span>
                </div>
                <p className="text-sm text-on-surface-variant">Due: {campaign.dueDate} &middot; {campaign.branches} branches</p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-black tracking-tighter text-on-surface">
                  {Math.round((campaign.confirmed / campaign.branches) * 100)}%
                </p>
                <p className="text-xs text-on-surface-variant font-medium">Completion</p>
              </div>
            </div>
            <div className="w-full h-2 bg-surface-container rounded-full overflow-hidden mb-4">
              <div className="h-full flex">
                <div className="bg-secondary h-full" style={{ width: `${(campaign.confirmed / campaign.branches) * 100}%` }} />
                <div className="bg-tertiary h-full" style={{ width: `${(campaign.failed / campaign.branches) * 100}%` }} />
              </div>
            </div>
            <div className="flex gap-6 text-sm">
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-secondary" />
                <span className="text-on-surface-variant font-medium">{campaign.confirmed} Confirmed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-tertiary" />
                <span className="text-on-surface-variant font-medium">{campaign.failed} Failed</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-surface-container-highest" />
                <span className="text-on-surface-variant font-medium">{campaign.pending} Pending</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
