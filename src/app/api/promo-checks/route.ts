import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';
import { checkPermission } from '@/lib/rbac';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scope = getDataScope(user, 'promoCheck');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const where: Record<string, unknown> = { ...scope };

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) where.dueDate = { ...((where.dueDate as any) || {}), gte: new Date(from) };
    if (to) where.dueDate = { ...((where.dueDate as any) || {}), lte: new Date(to) };

    const take = Math.min(parseInt(searchParams.get('take') || '100'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    const promoChecks = await prisma.promoCheck.findMany({
      where,
      take,
      skip,
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
      orderBy: { dueDate: 'desc' },
    });

    return NextResponse.json(promoChecks);
  } catch (error) {
    console.error('Failed to fetch promo checks:', error);
    return NextResponse.json(
      { error: 'Failed to fetch promo checks' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'create')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, branchId, checklistItems, dueDate, status } =
      body as {
        name?: string;
        description?: string;
        branchId?: string;
        checklistItems?: unknown;
        dueDate?: string;
        status?: string;
      };

    if (!name || !branchId) {
      return NextResponse.json(
        { error: 'Missing required fields: name and branchId are required' },
        { status: 400 }
      );
    }

    if (!checklistItems) {
      return NextResponse.json(
        { error: 'Missing required field: checklistItems' },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json(
        { error: `Branch with id "${branchId}" not found` },
        { status: 400 }
      );
    }

    const VALID_STATUSES = ['PENDING', 'CONFIRMED', 'FAILED'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const promoCheck = await prisma.promoCheck.create({
      data: {
        name,
        description: description ?? null,
        branchId,
        checklistItems: checklistItems as object,
        dueDate: dueDate ? new Date(dueDate) : null,
        status: (status as any) ?? undefined,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
      },
    });

    return NextResponse.json(promoCheck, { status: 201 });
  } catch (error) {
    console.error('Failed to create promo check:', error);
    return NextResponse.json(
      { error: 'Failed to create promo check' },
      { status: 500 }
    );
  }
}
