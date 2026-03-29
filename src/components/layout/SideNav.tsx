'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navItems = [
  { label: 'Dashboard', icon: 'dashboard', href: '/' },
  { label: 'Branch Registry', icon: 'storefront', href: '/branches' },
  { label: 'Audit Management', icon: 'assignment_turned_in', href: '/audits' },
  { label: 'Issue Management', icon: 'report_problem', href: '/issues' },
  { label: 'Escalation Engine', icon: 'priority_high', href: '/escalations' },
  { label: 'Promo Checks', icon: 'campaign', href: '/promos' },
  { label: 'Stock Requests', icon: 'inventory_2', href: '/stock-requests' },
  { label: 'SOP Library', icon: 'library_books', href: '/sop' },
  { label: 'Analytics', icon: 'analytics', href: '/analytics' },
];

export default function SideNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <aside className="hidden xl:flex flex-col fixed left-0 top-0 z-40 w-72 h-full pt-20 bg-slate-50 border-r border-slate-200/30">
      {/* Header */}
      <div className="px-6 pb-6">
        <p className="text-[11px] font-semibold uppercase tracking-widest text-slate-400">
          HQ Control
        </p>
        <p className="text-xs text-slate-400 mt-0.5">
          Multi-branch Layer
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`
                flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200
                ${
                  active
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-slate-600 hover:bg-slate-200/50 hover:translate-x-1'
                }
              `}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  active ? 'filled-icon' : ''
                }`}
              >
                {item.icon}
              </span>
              <span className="text-sm font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Bottom Action */}
      <div className="p-4">
        <Link
          href="/audits/new"
          className="flex items-center justify-center gap-2 w-full py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-br from-[#0058bc] to-[#0070eb] shadow-md hover:shadow-lg transition-shadow duration-200"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          New Audit
        </Link>
      </div>
    </aside>
  );
}
