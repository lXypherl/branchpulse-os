import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';
import { checkPermission } from '@/lib/rbac';
import { logAction } from '@/lib/audit-log';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scope = getDataScope(user, 'promoCheck');

    const { id } = await context.params;

    const promoCheck = await prisma.promoCheck.findFirst({
      where: { id, ...scope },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    if (!promoCheck) {
      return NextResponse.json(
        { error: 'Promo check not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(promoCheck);
  } catch (error) {
    console.error('Failed to fetch promo check:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo check' },
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

    const scope = getDataScope(user, 'promoCheck');

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.promoCheck.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Promo check not found' },
        { status: 404 }
      );
    }

    const {
      status,
      checklistItems,
      completedAt,
      name,
      description,
      dueDate,
    } = body as {
      status?: string;
      checklistItems?: unknown;
      completedAt?: string | null;
      name?: string;
      description?: string | null;
      dueDate?: string | null;
    };

    const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED'];

    if (status !== undefined && !VALID_STATUSES.includes(status)) {
      return NextResponse.json(
        { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
        { status: 400 }
      );
    }

    const data: Record<string, unknown> = {};

    if (name !== undefined) data.name = name;
    if (description !== undefined) data.description = description;
    if (checklistItems !== undefined) data.checklistItems = checklistItems as object;
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }

    if (status !== undefined) {
      data.status = status;
      // Auto-set completedAt when status changes to CONFIRMED
      if (status === 'CONFIRMED' && existing.status !== 'CONFIRMED') {
        data.completedAt = new Date();
      }
      // Clear completedAt when moving back to PENDING
      if (status === 'PENDING') {
        data.completedAt = null;
      }
    }

    // Allow explicit completedAt override
    if (completedAt !== undefined && data.completedAt === undefined) {
      data.completedAt = completedAt ? new Date(completedAt) : null;
    }

    const promoCheck = await prisma.promoCheck.update({
      where: { id },
      data,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
      },
    });

    // Fire-and-forget: audit log
    logAction(user.id, 'PROMO_CHECK_UPDATED', 'PromoCheck', promoCheck.id, `Status: ${existing.status} -> ${promoCheck.status}`);

    return NextResponse.json(promoCheck);
  } catch (error) {
    console.error('Failed to update promo check:', error);
    return NextResponse.json(
      { error: 'Failed to update promo check' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'delete')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const scope = getDataScope(user, 'promoCheck');

    const { id } = await context.params;

    const existing = await prisma.promoCheck.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Promo check not found' },
        { status: 404 }
      );
    }

    await prisma.promoCheck.delete({ where: { id } });

    return NextResponse.json({ message: 'Promo check deleted successfully' });
  } catch (error) {
    console.error('Failed to delete promo check:', error);
    return NextResponse.json(
      { error: 'Failed to delete promo check' },
      { status: 500 }
    );
  }
}
