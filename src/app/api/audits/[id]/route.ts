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

    const scope = getDataScope(user, 'audit');

    const { id } = await context.params;

    const audit = await prisma.audit.findFirst({
      where: { id, ...scope },
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            address: true,
            status: true,
            complianceScore: true,
          },
        },
        template: true,
        auditor: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
        issues: {
          include: {
            reportedBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
            escalations: true,
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!audit) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Failed to fetch audit:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audit' },
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

    const scope = getDataScope(user, 'audit');

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.audit.findFirst({ where: { id, ...scope } });
    if (!existing) {
      return NextResponse.json(
        { error: 'Audit not found' },
        { status: 404 }
      );
    }

    const { status, score, findings, evidenceUrls, reviewerId } = body as {
      status?: string;
      score?: number;
      findings?: string;
      evidenceUrls?: string[];
      reviewerId?: string;
    };

    const data: Record<string, unknown> = {};

    if (status !== undefined) {
      const VALID_TRANSITIONS: Record<string, string[]> = {
        DRAFT: ['SUBMITTED'],
        SUBMITTED: ['UNDER_REVIEW', 'RETURNED'],
        UNDER_REVIEW: ['APPROVED', 'RETURNED'],
        RETURNED: ['SUBMITTED'],
        APPROVED: ['CLOSED'],
        CLOSED: [],
      };
      const allowed = VALID_TRANSITIONS[existing.status] || [];
      if (!allowed.includes(status)) {
        return NextResponse.json(
          { error: `Cannot transition from ${existing.status} to ${status}. Allowed: ${allowed.join(', ') || 'none'}` },
          { status: 400 }
        );
      }

      data.status = status;

      if (status === 'SUBMITTED' && !existing.submittedAt) {
        data.submittedAt = new Date();
      }

      if (
        (status === 'APPROVED' || status === 'RETURNED') &&
        !existing.reviewedAt
      ) {
        data.reviewedAt = new Date();
      }
    }

    if (score !== undefined) data.score = score;
    if (findings !== undefined) data.findings = findings;
    if (evidenceUrls !== undefined) data.evidenceUrls = evidenceUrls;
    if (reviewerId !== undefined) data.reviewerId = reviewerId;

    const audit = await prisma.audit.update({
      where: { id },
      data,
      include: {
        branch: { select: { id: true, name: true, code: true } },
        template: { select: { id: true, name: true, category: true } },
        auditor: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
        issues: {
          include: {
            reportedBy: { select: { id: true, name: true } },
            assignedTo: { select: { id: true, name: true } },
          },
        },
      },
    });

    // Fire-and-forget: audit log
    const oldStatus = existing.status;
    const newStatus = status ?? oldStatus;
    logAction(user.id, 'AUDIT_UPDATED', 'Audit', audit.id, `Status: ${oldStatus} -> ${newStatus}`);

    // Notify auditor when status changes
    if (status && status !== oldStatus) {
      createNotification(
        audit.auditor.id,
        'Audit Status Changed',
        `Your audit for ${audit.branch.name} was ${newStatus.toLowerCase()}`,
        'audit_status'
      );
    }

    // Notify reviewer when audit is submitted
    if (status === 'SUBMITTED' && audit.reviewer) {
      createNotification(
        audit.reviewer.id,
        'Audit Submitted for Review',
        `An audit for ${audit.branch.name} has been submitted and needs your review`,
        'audit_submitted'
      );
    }

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Failed to update audit:', error);
    return NextResponse.json(
      { error: 'Failed to update audit' },
      { status: 500 }
    );
  }
}
