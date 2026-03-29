import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';
import { checkPermission } from '@/lib/rbac';
import { logAction } from '@/lib/audit-log';
import { createNotification } from '@/lib/notify';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const scope = getDataScope(user, 'issue');

    const { id } = await context.params;

    const issue = await prisma.issue.findFirst({
      where: { id, ...scope },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            status: true,
          },
        },
        reportedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        audit: {
          include: {
            template: { select: { id: true, name: true, category: true } },
            auditor: { select: { id: true, name: true } },
          },
        },
        escalations: {
          include: {
            escalatedTo: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    if (!issue) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to fetch issue:', error);
    return NextResponse.json(
      { error: 'Failed to fetch issue' },
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

    const scope = getDataScope(user, 'issue');

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.issue.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Issue not found' },
        { status: 404 }
      );
    }

    const {
      title,
      description,
      status,
      severity,
      assignedToId,
      correctiveAction,
      category,
      dueDate,
      evidenceUrls,
    } = body as {
      title?: string;
      description?: string;
      status?: string;
      severity?: string;
      assignedToId?: string | null;
      correctiveAction?: string;
      category?: string;
      dueDate?: string | null;
      evidenceUrls?: string[];
    };

    // Proof-of-closure enforcement: require corrective action before closing
    if (status === 'CLOSED') {
      const effectiveCorrectiveAction = correctiveAction !== undefined ? correctiveAction : existing.correctiveAction;
      if (!effectiveCorrectiveAction || effectiveCorrectiveAction.trim() === '') {
        return NextResponse.json(
          { error: 'Corrective action required before closing' },
          { status: 400 }
        );
      }
    }

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (status !== undefined) data.status = status;
    if (severity !== undefined) data.severity = severity;
    if (assignedToId !== undefined) data.assignedToId = assignedToId;
    if (correctiveAction !== undefined) data.correctiveAction = correctiveAction;
    if (category !== undefined) data.category = category;
    if (dueDate !== undefined) {
      data.dueDate = dueDate ? new Date(dueDate) : null;
    }
    if (evidenceUrls !== undefined) data.evidenceUrls = evidenceUrls;

    const issue = await prisma.issue.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        reportedBy: { select: { id: true, name: true, email: true } },
        assignedTo: { select: { id: true, name: true, email: true } },
        audit: { select: { id: true, score: true, status: true } },
        escalations: {
          include: {
            escalatedTo: { select: { id: true, name: true, email: true } },
          },
          orderBy: { triggeredAt: 'desc' },
        },
      },
    });

    // Fire-and-forget: audit log
    const oldStatus = existing.status;
    const newStatus = status ?? oldStatus;
    logAction(user.id, 'ISSUE_UPDATED', 'Issue', issue.id, `Status: ${oldStatus} -> ${newStatus}`);

    // Notify assignee on status change
    if (status && status !== oldStatus && issue.assignedTo) {
      createNotification(
        issue.assignedTo.id,
        'Issue Status Changed',
        `Issue "${issue.title}" status changed to ${newStatus.toLowerCase()}`,
        'issue_status'
      );
    }

    return NextResponse.json(issue);
  } catch (error) {
    console.error('Failed to update issue:', error);
    return NextResponse.json(
      { error: 'Failed to update issue' },
      { status: 500 }
    );
  }
}
