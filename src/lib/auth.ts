import { cookies } from 'next/headers';
import prisma from './prisma';

const SESSION_COOKIE = 'bp_session';

export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const user = await prisma.user.findUnique({
      where: { id: sessionCookie.value },
    });
    return user;
  } catch {
    return null;
  }
}

export async function setSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, userId, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 60 * 60 * 24 * 7, // 7 days
    path: '/',
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
}

export function getRoleLabel(role: string): string {
  const labels: Record<string, string> = {
    HQ_DIRECTOR: 'HQ Operations Director',
    FRANCHISE_MANAGER: 'Franchise Operations Manager',
    REGIONAL_MANAGER: 'Regional Manager',
    AREA_MANAGER: 'Area Manager',
    BRANCH_MANAGER: 'Branch Manager',
    FIELD_AUDITOR: 'Field Auditor',
    EXECUTIVE_VIEWER: 'Executive Viewer',
  };
  return labels[role] || role;
}

export function getRoleSublabel(role: string): string {
  const labels: Record<string, string> = {
    HQ_DIRECTOR: 'Global Command',
    FRANCHISE_MANAGER: 'Network Operations',
    REGIONAL_MANAGER: 'Regional Control',
    AREA_MANAGER: 'Area Operations',
    BRANCH_MANAGER: 'Branch Operations',
    FIELD_AUDITOR: 'Field Operations',
    EXECUTIVE_VIEWER: 'Executive Access',
  };
  return labels[role] || 'System Access';
}
