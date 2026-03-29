import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    const stockRequest = await prisma.stockRequest.findUnique({
      where: { id },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!stockRequest) {
      return NextResponse.json(
        { error: 'Stock request not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(stockRequest);
  } catch (error) {
    console.error('Failed to fetch stock request:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock request' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'update')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();
    const { status, notes } = body as { status?: string; notes?: string };

    const existing = await prisma.stockRequest.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Stock request not found' },
        { status: 404 }
      );
    }

    // Validate status transitions
    if (status) {
      const VALID_TRANSITIONS: Record<string, string[]> = {
        PENDING: ['APPROVED', 'REJECTED'],
        APPROVED: ['FULFILLED'],
        REJECTED: [],
        FULFILLED: [],
      };

      const allowed = VALID_TRANSITIONS[existing.status] ?? [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          {
            error: `Invalid status transition: cannot change from ${existing.status} to ${status}. Allowed transitions: ${allowed.length > 0 ? allowed.join(', ') : 'none'}`,
          },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};
    if (status !== undefined) data.status = status;
    if (notes !== undefined) data.notes = notes;

    const stockRequest = await prisma.stockRequest.update({
      where: { id },
      data,
      include: {
        branch: {
          select: { id: true, name: true, code: true, status: true },
        },
        requestedBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(stockRequest);
  } catch (error) {
    console.error('Failed to update stock request:', error);
    return NextResponse.json(
      { error: 'Failed to update stock request' },
      { status: 500 }
    );
  }
}
