import { NextResponse } from 'next/server';
import { authenticateUser, setSession } from '@/lib/auth';

// ---------------------------------------------------------------------------
// Simple in-memory rate limiting: max 5 failed attempts per email per 15 min
// ---------------------------------------------------------------------------
const failedAttempts = new Map<string, { count: number; firstAttempt: number }>();
const MAX_ATTEMPTS = 5;
const WINDOW_MS = 15 * 60 * 1000; // 15 minutes

function isRateLimited(email: string): boolean {
  const entry = failedAttempts.get(email);
  if (!entry) return false;

  // Reset window if expired
  if (Date.now() - entry.firstAttempt > WINDOW_MS) {
    failedAttempts.delete(email);
    return false;
  }

  return entry.count >= MAX_ATTEMPTS;
}

function recordFailure(email: string): void {
  const entry = failedAttempts.get(email);
  if (!entry || Date.now() - entry.firstAttempt > WINDOW_MS) {
    failedAttempts.set(email, { count: 1, firstAttempt: Date.now() });
  } else {
    entry.count++;
  }
}

function clearFailures(email: string): void {
  failedAttempts.delete(email);
}

// ---------------------------------------------------------------------------
// POST /api/auth/login
// ---------------------------------------------------------------------------
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, password } = body;

    if (!email || typeof email !== 'string' || !password || typeof password !== 'string') {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 },
      );
    }

    const normalizedEmail = email.trim().toLowerCase();

    // Check rate limit
    if (isRateLimited(normalizedEmail)) {
      return NextResponse.json(
        { error: 'Too many failed attempts. Please try again in 15 minutes.' },
        { status: 429 },
      );
    }

    const user = await authenticateUser(normalizedEmail, password);

    if (!user) {
      recordFailure(normalizedEmail);
      return NextResponse.json(
        { error: 'Invalid email or password' },
        { status: 401 },
      );
    }

    // Successful login: clear failed attempts and set session
    clearFailures(normalizedEmail);
    await setSession(user.id, user.role);

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}
