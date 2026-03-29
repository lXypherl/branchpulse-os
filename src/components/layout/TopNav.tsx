'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const navLinks = [
  { label: 'Dashboard', href: '/' },
  { label: 'Branch Registry', href: '/branches' },
  { label: 'Audits', href: '/audits' },
  { label: 'Issues', href: '/issues' },
  { label: 'Escalations', href: '/escalations' },
];

export default function TopNav() {
  const pathname = usePathname();

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(26,27,31,0.06)] border-b border-slate-200/50">
      <div className="flex items-center justify-between h-16 px-8">
        {/* Left - Brand */}
        <div className="flex-shrink-0">
          <Link href="/" className="text-xl font-black tracking-tighter text-slate-900">
            BranchPulse OS
          </Link>
        </div>

        {/* Center - Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 h-full">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`
                flex items-center h-full px-4 text-sm transition-colors duration-200
                ${
                  isActive(link.href)
                    ? 'text-blue-600 font-semibold border-b-2 border-blue-600'
                    : 'text-slate-500 hover:text-slate-900'
                }
              `}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right - User / Actions */}
        <div className="flex items-center gap-5">
          {/* Role Label */}
          <div className="hidden lg:flex flex-col items-end">
            <span className="text-sm font-semibold text-slate-700 leading-tight">
              HQ Operations Director
            </span>
            <span className="text-xs text-slate-400 leading-tight">
              Global Command
            </span>
          </div>

          {/* Notification Bell */}
          <button
            className="relative text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Notifications"
          >
            <span className="material-symbols-outlined text-[22px]">notifications</span>
          </button>

          {/* Settings Gear */}
          <button
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>

          {/* Avatar Placeholder */}
          <div className="rounded-full bg-slate-200 w-8 h-8 flex-shrink-0" />
        </div>
      </div>
    </header>
  );
}
