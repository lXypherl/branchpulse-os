import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('active');

    const where: Record<string, unknown> = {};

    if (activeOnly === 'true') {
      where.resolvedAt = null;
    }

    const escalations = await prisma.escalation.findMany({
      where,
      include: {
        issue: {
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
              select: { id: true, name: true, email: true },
            },
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
        },
        escalatedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { triggeredAt: 'desc' },
    });

    return NextResponse.json(escalations);
  } catch (error) {
    console.error('Failed to fetch escalations:', error);
    return NextResponse.json(
      { error: 'Failed to fetch escalations' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { issueId, escalatedToId, reason, level } = body as {
      issueId?: string;
      escalatedToId?: string;
      reason?: string;
      level?: number;
    };

    if (!issueId || !escalatedToId || !reason) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: issueId, escalatedToId, and reason are required',
        },
        { status: 400 }
      );
    }

    const issue = await prisma.issue.findUnique({ where: { id: issueId } });
    if (!issue) {
      return NextResponse.json(
        { error: `Issue with id "${issueId}" not found` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: escalatedToId },
    });
    if (!user) {
      return NextResponse.json(
        { error: `User with id "${escalatedToId}" not found` },
        { status: 400 }
      );
    }

    // Determine escalation level: use provided level or auto-increment
    let escalationLevel = level;
    if (escalationLevel === undefined) {
      const maxEscalation = await prisma.escalation.findFirst({
        where: { issueId },
        orderBy: { level: 'desc' },
        select: { level: true },
      });
      escalationLevel = (maxEscalation?.level ?? 0) + 1;
    }

    const escalation = await prisma.escalation.create({
      data: {
        issueId,
        escalatedToId,
        reason,
        level: escalationLevel,
      },
      include: {
        issue: {
          include: {
            branch: { select: { id: true, name: true, code: true } },
            reportedBy: { select: { id: true, name: true } },
          },
        },
        escalatedTo: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    return NextResponse.json(escalation, { status: 201 });
  } catch (error) {
    console.error('Failed to create escalation:', error);
    return NextResponse.json(
      { error: 'Failed to create escalation' },
      { status: 500 }
    );
  }
}
