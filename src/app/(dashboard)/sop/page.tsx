export default function SOPLibraryPage() {
  const demoSOPs = [
    { id: '1', title: 'Food Safety & Hygiene Standards', version: '4.2', category: 'Safety', updatedAt: 'Mar 15, 2026', status: 'current', sections: 12 },
    { id: '2', title: 'Customer Service Protocol', version: '3.1', category: 'Operations', updatedAt: 'Feb 28, 2026', status: 'current', sections: 8 },
    { id: '3', title: 'Inventory Management Guide', version: '2.5', category: 'Inventory', updatedAt: 'Jan 20, 2026', status: 'current', sections: 15 },
    { id: '4', title: 'Emergency Response Procedures', version: '5.0', category: 'Safety', updatedAt: 'Mar 01, 2026', status: 'current', sections: 6 },
    { id: '5', title: 'Visual Merchandising Standards', version: '1.8', category: 'Brand', updatedAt: 'Dec 10, 2025', status: 'review', sections: 10 },
    { id: '6', title: 'Cash Handling & POS Operations', version: '3.3', category: 'Finance', updatedAt: 'Mar 22, 2026', status: 'current', sections: 9 },
  ];

  const categoryColors: Record<string, string> = {
    Safety: 'bg-red-50 text-red-700 border-red-100',
    Operations: 'bg-blue-50 text-blue-700 border-blue-100',
    Inventory: 'bg-amber-50 text-amber-700 border-amber-100',
    Brand: 'bg-purple-50 text-purple-700 border-purple-100',
    Finance: 'bg-emerald-50 text-emerald-700 border-emerald-100',
  };

  return (
    <div className="max-w-[1400px] mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black text-on-surface tracking-tighter mb-2">SOP Library</h1>
          <p className="text-on-surface-variant font-medium">Governed standards and operating procedures across all branches.</p>
        </div>
        <div className="flex gap-3">
          <div className="bg-surface-container-low px-4 py-2 rounded-xl flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-lg">auto_awesome</span>
            <span className="text-xs font-bold text-primary uppercase tracking-widest">AI Q&A Active</span>
          </div>
          <button className="px-6 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all flex items-center gap-2">
            <span className="material-symbols-outlined text-[20px]">upload</span>
            Upload SOP
          </button>
        </div>
      </header>

      {/* AI Q&A Widget */}
      <div className="bg-gradient-to-br from-indigo-950 to-slate-900 p-8 rounded-[32px] text-white shadow-2xl relative overflow-hidden mb-10">
        <div className="absolute -top-12 -right-12 w-40 h-40 bg-primary rounded-full blur-[60px] opacity-20" />
        <div className="relative z-10 flex items-center gap-6">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center backdrop-blur-md">
                <span className="material-symbols-outlined text-[18px] text-primary-fixed-dim">auto_awesome</span>
              </div>
              <span className="text-xs font-black uppercase tracking-[0.2em] text-primary-fixed-dim">SOP AI Assistant</span>
            </div>
            <p className="text-lg font-medium text-slate-300">Ask questions about any SOP document. Answers are grounded exclusively on governed source content.</p>
          </div>
          <div className="flex-1">
            <div className="bg-white/10 rounded-xl border border-white/10 p-4 flex items-center gap-3">
              <span className="material-symbols-outlined text-slate-400">search</span>
              <span className="text-sm text-slate-500">Ask a question about SOPs...</span>
            </div>
          </div>
        </div>
      </div>

      {/* SOP Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {demoSOPs.map((sop) => (
          <div key={sop.id} className="bg-surface-container-lowest rounded-xl shadow-ambient border border-outline-variant/10 p-6 hover:shadow-ambient-lg transition-shadow cursor-pointer group">
            <div className="flex items-start justify-between mb-4">
              <span className={`px-2 py-1 rounded text-[10px] font-bold border ${categoryColors[sop.category]}`}>
                {sop.category}
              </span>
              <span className="text-[10px] font-bold text-on-surface-variant">v{sop.version}</span>
            </div>
            <h3 className="text-lg font-bold text-on-surface tracking-tight mb-2 group-hover:text-primary transition-colors">{sop.title}</h3>
            <p className="text-xs text-on-surface-variant mb-4">{sop.sections} sections &middot; Updated {sop.updatedAt}</p>
            <div className="flex items-center justify-between pt-4 border-t border-outline-variant/10">
              <span className={`text-[10px] font-bold uppercase tracking-widest ${
                sop.status === 'current' ? 'text-secondary' : 'text-amber-600'
              }`}>
                {sop.status === 'current' ? 'Current' : 'Under Review'}
              </span>
              <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:translate-x-1 transition-transform">arrow_forward</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
