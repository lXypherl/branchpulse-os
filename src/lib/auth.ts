import { cookies } from 'next/headers';
import prisma from './prisma';
import { verifyPassword } from './password';

const SESSION_COOKIE = 'bp_session';

interface SessionPayload {
  id: string;
  role: string;
}

/**
 * Full session fetch: parses cookie JSON, then loads user from DB.
 * Use in API routes and server components where you need the full user object.
 */
export async function getSession() {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE);
  if (!sessionCookie?.value) return null;

  try {
    const payload: SessionPayload = JSON.parse(sessionCookie.value);
    if (!payload.id) return null;

    const user = await prisma.user.findUnique({
      where: { id: payload.id },
    });
    return user;
  } catch {
    return null;
  }
}

/**
 * Lightweight session read: parses JSON cookie only (no DB hit).
 * Use in middleware for routing decisions.
 */
export function getSessionFromCookie(cookieValue: string | undefined): SessionPayload | null {
  if (!cookieValue) return null;
  try {
    const payload: SessionPayload = JSON.parse(cookieValue);
    if (!payload.id || !payload.role) return null;
    return payload;
  } catch {
    return null;
  }
}

/**
 * Authenticate user by email and password, then set session cookie.
 * Returns the user on success, null on failure.
 */
export async function authenticateUser(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email },
  });

  if (!user || !user.passwordHash) return null;

  const valid = await verifyPassword(password, user.passwordHash);
  if (!valid) return null;

  return user;
}

export async function setSession(userId: string, role: string) {
  const cookieStore = await cookies();
  const payload: SessionPayload = { id: userId, role };
  cookieStore.set(SESSION_COOKIE, JSON.stringify(payload), {
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
