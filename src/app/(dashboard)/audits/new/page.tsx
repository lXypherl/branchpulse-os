'use client';

import Link from 'next/link';
import { useState } from 'react';
import FileUpload from '@/components/shared/FileUpload';

export default function NewAuditPage() {
  const [evidenceUrls, setEvidenceUrls] = useState<string[]>([]);

  return (
    <div className="max-w-3xl mx-auto">
      <div className="mb-8">
        <nav className="flex items-center gap-2 text-xs font-bold text-slate-400 uppercase tracking-widest mb-2">
          <Link href="/audits" className="hover:text-slate-600 transition-colors">Audits</Link>
          <span className="material-symbols-outlined text-[14px]">chevron_right</span>
          <span className="text-blue-600">New Audit</span>
        </nav>
        <h1 className="text-4xl font-extrabold tracking-tight text-on-background">Schedule New Audit</h1>
        <p className="text-on-surface-variant mt-1">Create a new audit for a branch location.</p>
      </div>

      <div className="bg-surface-container-lowest rounded-3xl border border-outline-variant/15 p-8 shadow-sm space-y-8">
        {/* Branch Selection */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Branch Location
          </label>
          <select className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            <option value="">Select a branch...</option>
            <option>Lexington Ave (Flagship)</option>
            <option>Chelsea Market Hub</option>
            <option>Times Square North</option>
            <option>SoHo Boutique Br.</option>
            <option>Downtown Flagship</option>
            <option>Northside Plaza</option>
            <option>South Metro Hub</option>
            <option>East Ridge Mall</option>
          </select>
        </div>

        {/* Audit Template */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Audit Template
          </label>
          <select className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            <option value="">Select a template...</option>
            <option>Safety Compliance</option>
            <option>Standard Review</option>
            <option>Inventory Hygiene</option>
          </select>
        </div>

        {/* Auditor */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Assign Auditor
          </label>
          <select className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all">
            <option value="">Select an auditor...</option>
            <option>James Smith</option>
            <option>Laura Reyes</option>
            <option>Mark Klein</option>
            <option>Ana Martin</option>
          </select>
        </div>

        {/* Schedule Date */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Scheduled Date
          </label>
          <input
            type="date"
            className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
          />
        </div>

        {/* Notes */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Notes (Optional)
          </label>
          <textarea
            rows={3}
            placeholder="Add any special instructions for this audit..."
            className="w-full px-4 py-3 bg-surface-container-low rounded-xl text-on-surface font-medium focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all resize-none placeholder:text-outline"
          />
        </div>

        {/* Evidence Photos */}
        <div>
          <label className="block text-xs font-bold text-on-surface-variant uppercase tracking-widest mb-2">
            Evidence Photos (Optional)
          </label>
          <FileUpload value={evidenceUrls} onChange={setEvidenceUrls} maxFiles={10} />
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4 pt-4">
          <button className="flex-1 py-3 bg-gradient-to-br from-primary to-primary-container text-on-primary font-semibold rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-95 transition-all">
            Schedule Audit
          </button>
          <Link
            href="/audits"
            className="flex-1 py-3 bg-surface-container-highest text-on-surface-variant font-semibold rounded-xl text-center hover:bg-surface-variant transition-all"
          >
            Cancel
          </Link>
        </div>
      </div>
    </div>
  );
}
