import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const where: Record<string, unknown> = {};

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const issues = await prisma.issue.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        audit: {
          select: {
            id: true,
            score: true,
            status: true,
          },
        },
        escalations: {
          select: {
            id: true,
            level: true,
            reason: true,
            triggeredAt: true,
            resolvedAt: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(issues);
  } catch (error) {
    console.error('Failed to fetch issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issues' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      title,
      description,
      branchId,
      reportedById,
      assignedToId,
      severity,
      category,
      dueDate,
      evidenceUrls,
      auditId,
    } = body as {
      title?: string;
      description?: string;
      branchId?: string;
      reportedById?: string;
      assignedToId?: string;
      severity?: string;
      category?: string;
      dueDate?: string;
      evidenceUrls?: string[];
      auditId?: string;
    };

    if (!title || !branchId || !severity) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: title, branchId, and severity are required',
        },
        { status: 400 }
      );
    }

    if (!reportedById) {
      return NextResponse.json(
        { error: 'Missing required field: reportedById' },
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

    const reporter = await prisma.user.findUnique({
      where: { id: reportedById },
    });
    if (!reporter) {
      return NextResponse.json(
        { error: `User with id "${reportedById}" not found` },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.create({
      data: {
        title,
        description: description ?? '',
        branchId,
        reportedById,
        assignedToId: assignedToId ?? null,
        severity: severity as 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW',
        category: category ?? 'General',
        dueDate: dueDate ? new Date(dueDate) : null,
        evidenceUrls: evidenceUrls ?? [],
        auditId: auditId ?? null,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        audit: { select: { id: true, score: true, status: true } },
      },
    });

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Failed to create issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
