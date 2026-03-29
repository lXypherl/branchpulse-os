import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const branch = await prisma.branch.findUnique({
      where: { id },
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
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    const {
      name,
      code,
      address,
      status,
      managerId,
      areaId,
      complianceScore,
      lastAuditDate,
      operatingHours,
    } = body as {
      name?: string;
      code?: string;
      address?: string;
      status?: string;
      managerId?: string | null;
      areaId?: string;
      complianceScore?: number;
      lastAuditDate?: string;
      operatingHours?: string | null;
    };

    const data: Record<string, unknown> = {};
    if (name !== undefined) data.name = name;
    if (code !== undefined) data.code = code;
    if (address !== undefined) data.address = address;
    if (status !== undefined) data.status = status;
    if (managerId !== undefined) data.managerId = managerId;
    if (areaId !== undefined) data.areaId = areaId;
    if (complianceScore !== undefined) data.complianceScore = complianceScore;
    if (lastAuditDate !== undefined) data.lastAuditDate = new Date(lastAuditDate);
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
    const { id } = await context.params;

    const existing = await prisma.branch.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Branch not found' },
        { status: 404 }
      );
    }

    await prisma.branch.delete({ where: { id } });

    return NextResponse.json({ message: 'Branch deleted successfully' });
  } catch (error) {
    console.error('Failed to delete branch:', error);
    return NextResponse.json(
      { error: 'Failed to delete branch' },
      { status: 500 }
    );
  }
}
