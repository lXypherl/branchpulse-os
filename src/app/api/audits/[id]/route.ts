import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const { id } = await context.params;

    const audit = await prisma.audit.findUnique({
      where: { id },
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
    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.audit.findUnique({ where: { id } });
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

    return NextResponse.json(audit);
  } catch (error) {
    console.error('Failed to update audit:', error);
    return NextResponse.json(
      { error: 'Failed to update audit' },
      { status: 500 }
    );
  }
}
