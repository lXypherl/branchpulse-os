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

    const scope = getDataScope(user, 'audit');

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

    const take = Math.min(parseInt(searchParams.get('take') || '100'), 100);
    const skip = parseInt(searchParams.get('skip') || '0');

    const audits = await prisma.audit.findMany({
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
        template: {
          select: {
            id: true,
            name: true,
            category: true,
          },
        },
        auditor: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
        reviewer: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(audits);
  } catch (error) {
    console.error('Failed to fetch audits:', error);
    return NextResponse.json(
      { error: 'Failed to fetch audits' },
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
      branchId,
      templateId,
      auditorId,
      status,
      score,
      findings,
      evidenceUrls,
    } = body as {
      branchId?: string;
      templateId?: string;
      auditorId?: string;
      status?: string;
      score?: number;
      findings?: string;
      evidenceUrls?: string[];
    };

    if (!branchId || !templateId || !auditorId) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: branchId, templateId, and auditorId are required',
        },
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

    const template = await prisma.auditTemplate.findUnique({
      where: { id: templateId },
    });
    if (!template) {
      return NextResponse.json(
        { error: `Audit template with id "${templateId}" not found` },
        { status: 400 }
      );
    }

    const auditor = await prisma.user.findUnique({ where: { id: auditorId } });
    if (!auditor) {
      return NextResponse.json(
        { error: `User with id "${auditorId}" not found` },
        { status: 400 }
      );
    }

    const VALID_STATUSES = ['DRAFT', 'SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'RETURNED', 'CLOSED'];
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` }, { status: 400 });
    }

    const audit = await prisma.audit.create({
      data: {
        branchId,
        templateId,
        auditorId,
        status: (status as any) ?? undefined,
        score: score ?? null,
        findings: findings ?? null,
        evidenceUrls: evidenceUrls ?? [],
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        template: { select: { id: true, name: true, category: true } },
        auditor: { select: { id: true, name: true, email: true } },
        reviewer: { select: { id: true, name: true, email: true } },
      },
    });

    // Fire-and-forget: audit log
    logAction(user.id, 'AUDIT_CREATED', 'Audit', audit.id, `Branch: ${audit.branch.name}, Template: ${audit.template.name}`);

    return NextResponse.json(audit, { status: 201 });
  } catch (error) {
    console.error('Failed to create audit:', error);
    return NextResponse.json(
      { error: 'Failed to create audit' },
      { status: 500 }
    );
  }
}
