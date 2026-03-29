import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';
import { checkPermission } from '@/lib/rbac';
import { logAction } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scope = getDataScope(user, 'branch');

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const region = searchParams.get('region');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = { ...scope };

    if (status) {
      where.status = status;
    }

    if (region) {
      where.area = {
        regionId: region,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) where.lastAuditDate = { ...((where.lastAuditDate as any) || {}), gte: new Date(from) };
    if (to) where.lastAuditDate = { ...((where.lastAuditDate as any) || {}), lte: new Date(to) };

    const take = Math.min(parseInt(searchParams.get('take') || '100'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    const branches = await prisma.branch.findMany({
      where,
      take,
      skip,
      include: {
        area: {
          include: {
            region: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
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
    const { name, code, areaId, address, managerId, operatingHours, status } =
      body as {
        name?: string;
        code?: string;
        areaId?: string;
        address?: string;
        managerId?: string;
        operatingHours?: string;
        status?: string;
      };

    if (!name || !code || !areaId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, and areaId are required' },
        { status: 400 }
      );
    }

    const VALID_STATUSES = ['ACTIVE', 'MAINTENANCE', 'INACTIVE'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      return NextResponse.json(
        { error: `Area with id "${areaId}" not found` },
        { status: 400 }
      );
    }

    try {
      const branch = await prisma.branch.create({
        data: {
          name,
          code,
          areaId,
          address: address ?? '',
          managerId: managerId ?? null,
          operatingHours: operatingHours ?? null,
          status: (status as any) ?? undefined,
        },
        include: {
          area: {
            include: { region: true },
          },
          manager: {
            select: {
              id: true,
              name: true,
              email: true,
              role: true,
              avatarUrl: true,
            },
          },
        },
      });

      // Fire-and-forget: audit log
      logAction(user.id, 'BRANCH_CREATED', 'Branch', branch.id, `${branch.name} (${branch.code})`);

      return NextResponse.json(branch, { status: 201 });
    } catch (error: any) {
      if (error?.code === 'P2002') {
        return NextResponse.json({ error: 'Branch code already exists' }, { status: 409 });
      }
      throw error;
    }
  } catch (error) {
    console.error('Failed to create branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
