'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import NotificationBell from './NotificationBell';

const navLinks = [
  { label: 'Dashboard', href: '/' },
  { label: 'Branch Registry', href: '/branches' },
  { label: 'Audits', href: '/audits' },
  { label: 'Issues', href: '/issues' },
  { label: 'Escalations', href: '/escalations' },
];

const roleLabels: Record<string, string> = {
  HQ_DIRECTOR: 'HQ Operations Director',
  FRANCHISE_MANAGER: 'Franchise Operations Manager',
  REGIONAL_MANAGER: 'Regional Manager',
  AREA_MANAGER: 'Area Manager',
  BRANCH_MANAGER: 'Branch Manager',
  FIELD_AUDITOR: 'Field Auditor',
  EXECUTIVE_VIEWER: 'Executive Viewer',
};

const roleSublabels: Record<string, string> = {
  HQ_DIRECTOR: 'Global Command',
  FRANCHISE_MANAGER: 'Network Operations',
  REGIONAL_MANAGER: 'Regional Control',
  AREA_MANAGER: 'Area Operations',
  BRANCH_MANAGER: 'Branch Operations',
  FIELD_AUDITOR: 'Field Operations',
  EXECUTIVE_VIEWER: 'Executive Access',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

interface TopNavProps {
  user: { name: string; role: string; email: string } | null;
}

export default function TopNav({ user }: TopNavProps) {
  const pathname = usePathname();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    window.location.href = '/login';
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-xl shadow-[0px_12px_32px_rgba(26,27,31,0.06)] border-b border-slate-200/50">
      <div className="flex items-center justify-between h-16 px-8">
        {/* Left - Brand */}
        <div className="flex-shrink-0 flex items-center gap-2.5">
          <Link href="/" className="text-xl font-black tracking-tighter text-slate-900">
            Xyloquent Branch OS
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
              {user ? roleLabels[user.role] || user.role : 'Not signed in'}
            </span>
            <span className="text-xs text-slate-400 leading-tight">
              {user ? roleSublabels[user.role] || 'System Access' : ''}
            </span>
          </div>

          {/* Notification Bell */}
          <NotificationBell />

          {/* Settings Gear */}
          <button
            className="text-slate-500 hover:text-slate-700 transition-colors"
            aria-label="Settings"
          >
            <span className="material-symbols-outlined text-[22px]">settings</span>
          </button>

          {/* Avatar + Dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu((prev) => !prev)}
              className="rounded-full bg-primary text-on-primary w-8 h-8 flex-shrink-0 flex items-center justify-center text-xs font-semibold hover:ring-2 hover:ring-primary/20 transition-all"
              aria-label="User menu"
            >
              {user ? getInitials(user.name) : '?'}
            </button>

            {showUserMenu && (
              <>
                {/* Backdrop to close menu */}
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                {/* Dropdown menu */}
                <div className="absolute right-0 top-full mt-2 z-50 w-64 bg-surface-container-lowest rounded-xl border border-outline-variant/15 shadow-ambient-lg py-2">
                  {user && (
                    <div className="px-4 py-3 border-b border-outline-variant/10">
                      <p className="text-sm font-semibold text-on-surface truncate">
                        {user.name}
                      </p>
                      <p className="text-xs text-on-surface-variant truncate mt-0.5">
                        {user.email}
                      </p>
                      <p className="text-xs text-primary font-medium mt-1">
                        {roleLabels[user.role] || user.role}
                      </p>
                    </div>
                  )}
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2.5 text-sm text-on-surface-variant hover:bg-surface-container hover:text-on-surface transition-colors flex items-center gap-2"
                  >
                    <span className="material-symbols-outlined text-lg">logout</span>
                    Sign out
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
