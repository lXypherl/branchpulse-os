import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';
import { checkPermission } from '@/lib/rbac';
import { logAction } from '@/lib/audit-log';
import { createNotification } from '@/lib/notify';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scope = getDataScope(user, 'issue');

    const { searchParams } = new URL(request.url);
    const severity = searchParams.get('severity');
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const where: Record<string, unknown> = { ...scope };

    if (severity) {
      where.severity = severity;
    }

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const from = searchParams.get('from');
    const to = searchParams.get('to');
    if (from) where.createdAt = { ...((where.createdAt as any) || {}), gte: new Date(from) };
    if (to) where.createdAt = { ...((where.createdAt as any) || {}), lte: new Date(to) };

    const take = Math.min(parseInt(searchParams.get('take') || '100'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    const issues = await prisma.issue.findMany({
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
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'create')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

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

    const VALID_SEVERITIES = ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'];
    if (severity && !VALID_SEVERITIES.includes(severity)) {
      return NextResponse.json({ error: `Invalid severity. Must be one of: ${VALID_SEVERITIES.join(', ')}` }, { status: 400 });
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

    if (assignedToId) {
      const assignee = await prisma.user.findUnique({ where: { id: assignedToId } });
      if (!assignee) return NextResponse.json({ error: 'Assigned user not found' }, { status: 400 });
    }
    if (auditId) {
      const audit = await prisma.audit.findUnique({ where: { id: auditId } });
      if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 400 });
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

    // Fire-and-forget: audit log
    logAction(user.id, 'ISSUE_CREATED', 'Issue', issue.id, `${issue.title} [${issue.severity}] at ${issue.branch.name}`);

    // Notify assigned user
    if (issue.assignedTo) {
      createNotification(
        issue.assignedTo.id,
        'New Issue Assigned',
        `You have been assigned issue "${issue.title}" at ${issue.branch.name}`,
        'issue_assigned'
      );
    }

    return NextResponse.json(issue, { status: 201 });
  } catch (error) {
    console.error('Failed to create issue:', error);
    return NextResponse.json(
      { error: 'Failed to create issue' },
      { status: 500 }
    );
  }
}
