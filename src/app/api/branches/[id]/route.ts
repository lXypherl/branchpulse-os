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

    const scope = getDataScope(user, 'branch');

    const { id } = await context.params;

    const branch = await prisma.branch.findFirst({
      where: { id, ...scope },
      include: {
        area: {
          include: {
            region: {
              include: { organization: true },
            },
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
        audits: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            template: true,
            auditor: { select: { id: true, name: true, email: true } },
          },
        },
        issues: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: {
            reportedBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
        promoChecks: {
          orderBy: { dueDate: 'desc' },
          take: 5,
        },
        stockRequests: {
          orderBy: { createdAt: 'desc' },
          take: 5,
          include: {
            requestedBy: { select: { id: true, name: true } },
          },
        },
      },
    });

    if (!branch) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Failed to fetch branch:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branch' },
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

    const scope = getDataScope(user, 'branch');

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.branch.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    delete body.complianceScore;
    delete body.lastAuditDate;

    const {
      name,
      code,
      address,
      status,
      managerId,
      areaId,
      operatingHours,
    } = body as {
      name?: string;
      code?: string;
      address?: string;
      status?: string;
      managerId?: string | null;
      areaId?: string;
      operatingHours?: string | null;
    };

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (address !== undefined) data.address = address;
    if (status !== undefined) data.status = status;
    if (managerId !== undefined) data.managerId = managerId;
    if (areaId !== undefined) data.areaId = areaId;
    if (operatingHours !== undefined) data.operatingHours = operatingHours;

    const branch = await prisma.branch.update({
      where: { id },
      data,
      include: {
        area: { include: { region: true } },
        manager: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
    });

    // Fire-and-forget: audit log
    logAction(user.id, 'BRANCH_UPDATED', 'Branch', branch.id, `${branch.name} (${branch.code})`);

    return NextResponse.json(branch);
  } catch (error) {
    console.error('Failed to update branch:', error);
    return NextResponse.json(
      { error: 'Failed to update branch' },
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

    const scope = getDataScope(user, 'branch');

    const { id } = await context.params;

    const existing = await prisma.branch.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    try {
      await prisma.branch.delete({ where: { id } });
    } catch (error: any) {
      if (error?.code === 'P2003') {
        return NextResponse.json(
          { error: 'Cannot delete branch with existing audits, issues, or other records. Deactivate it instead.' },
          { status: 409 }
        );
      }
      throw error;
    }

    // Fire-and-forget: audit log
    logAction(user.id, 'BRANCH_DELETED', 'Branch', id, `${existing.name} (${existing.code})`);

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Failed to delete branch:', error);
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
