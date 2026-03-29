import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { logAction } from '@/lib/audit-log';
import { createNotification } from '@/lib/notify';

const ALLOWED_ROLES = ['HQ_DIRECTOR', 'FRANCHISE_MANAGER'];

const CRITICAL_INITIAL_HOURS = 4;
const HIGH_INITIAL_HOURS = 12;
const CRITICAL_RE_ESCALATE_HOURS = 24;

function hoursAgo(hours: number): Date {
  return new Date(Date.now() - hours * 60 * 60 * 1000);
}

async function findEscalationTarget(
  branch: { areaId: string; area: { id: string; regionId: string } },
  level: number,
): Promise<{ id: string; name: string } | null> {
  if (level === 1) {
    // Area manager
    const areaManager = await prisma.user.findFirst({
      where: { role: 'AREA_MANAGER', areaId: branch.areaId },
      select: { id: true, name: true },
    });
    return areaManager;
  }
  if (level === 2) {
    // Regional manager
    const regionalManager = await prisma.user.findFirst({
      where: { role: 'REGIONAL_MANAGER', regionId: branch.area.regionId },
      select: { id: true, name: true },
    });
    return regionalManager;
  }
  // Level 3+: HQ Director
  const hqDirector = await prisma.user.findFirst({
    where: { role: 'HQ_DIRECTOR' },
    select: { id: true, name: true },
  });
  return hqDirector;
}

export async function POST() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    if (!ALLOWED_ROLES.includes(user.role)) {
      return NextResponse.json(
        { error: 'Forbidden: only HQ_DIRECTOR and FRANCHISE_MANAGER can trigger auto-escalation' },
        { status: 403 },
      );
    }

    const details: Array<{
      issueId: string;
      issueTitle: string;
      branchName: string;
      level: number;
      escalatedTo: string;
      reason: string;
    }> = [];

    // -----------------------------------------------------------------------
    // 1. CRITICAL issues older than 4 hours with NO escalation yet  -> Level 1
    // -----------------------------------------------------------------------
    const criticalNoEsc = await prisma.issue.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        severity: 'CRITICAL',
        createdAt: { lte: hoursAgo(CRITICAL_INITIAL_HOURS) },
        escalations: { none: {} },
      },
      include: {
        branch: {
          include: { area: { include: { region: true } } },
        },
      },
    });

    // -----------------------------------------------------------------------
    // 2. HIGH issues older than 12 hours with NO escalation yet  -> Level 1
    // -----------------------------------------------------------------------
    const highNoEsc = await prisma.issue.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        severity: 'HIGH',
        createdAt: { lte: hoursAgo(HIGH_INITIAL_HOURS) },
        escalations: { none: {} },
      },
      include: {
        branch: {
          include: { area: { include: { region: true } } },
        },
      },
    });

    // -----------------------------------------------------------------------
    // 3. CRITICAL issues with existing escalation where last escalation is
    //    >24 hours old  -> Level bump
    // -----------------------------------------------------------------------
    const criticalReEsc = await prisma.issue.findMany({
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        severity: 'CRITICAL',
        escalations: { some: {} },
      },
      include: {
        branch: {
          include: { area: { include: { region: true } } },
        },
        escalations: {
          orderBy: { level: 'desc' },
          take: 1,
        },
      },
    });

    // Filter to only those whose most recent escalation is older than 24h
    const reEscCutoff = hoursAgo(CRITICAL_RE_ESCALATE_HOURS);
    const criticalNeedBump = criticalReEsc.filter((issue) => {
      const latest = issue.escalations[0];
      return latest && new Date(latest.triggeredAt) <= reEscCutoff && latest.level < 3;
    });

    // -----------------------------------------------------------------------
    // Process Level 1 escalations (no prior escalation)
    // -----------------------------------------------------------------------
    const level1Issues = [...criticalNoEsc, ...highNoEsc];
    for (const issue of level1Issues) {
      const target = await findEscalationTarget(issue.branch, 1);
      if (!target) continue;

      const reason =
        issue.severity === 'CRITICAL'
          ? `Auto-escalation: CRITICAL issue open > ${CRITICAL_INITIAL_HOURS}h without escalation`
          : `Auto-escalation: HIGH issue open > ${HIGH_INITIAL_HOURS}h without escalation`;

      const escalation = await prisma.escalation.create({
        data: {
          issueId: issue.id,
          level: 1,
          escalatedToId: target.id,
          reason,
        },
      });

      logAction(
        user.id,
        'AUTO_ESCALATION',
        'Escalation',
        escalation.id,
        `Auto L1: ${issue.title} at ${issue.branch.name}`,
      );

      createNotification(
        target.id,
        'Auto-Escalation: Level 1',
        `Issue "${issue.title}" at ${issue.branch.name} has been auto-escalated to you (Level 1). Reason: ${reason}`,
        'escalation',
      );

      details.push({
        issueId: issue.id,
        issueTitle: issue.title,
        branchName: issue.branch.name,
        level: 1,
        escalatedTo: target.name,
        reason,
      });
    }

    // -----------------------------------------------------------------------
    // Process level bumps for CRITICAL re-escalations
    // -----------------------------------------------------------------------
    for (const issue of criticalNeedBump) {
      const currentLevel = issue.escalations[0].level;
      const nextLevel = Math.min(currentLevel + 1, 3);

      const target = await findEscalationTarget(issue.branch, nextLevel);
      if (!target) continue;

      const reason = `Auto-escalation: CRITICAL issue still unresolved > ${CRITICAL_RE_ESCALATE_HOURS}h since last escalation (L${currentLevel} -> L${nextLevel})`;

      const escalation = await prisma.escalation.create({
        data: {
          issueId: issue.id,
          level: nextLevel,
          escalatedToId: target.id,
          reason,
        },
      });

      logAction(
        user.id,
        'AUTO_ESCALATION',
        'Escalation',
        escalation.id,
        `Auto L${nextLevel}: ${issue.title} at ${issue.branch.name}`,
      );

      createNotification(
        target.id,
        `Auto-Escalation: Level ${nextLevel}`,
        `Issue "${issue.title}" at ${issue.branch.name} has been auto-escalated to you (Level ${nextLevel}). Reason: ${reason}`,
        'escalation',
      );

      details.push({
        issueId: issue.id,
        issueTitle: issue.title,
        branchName: issue.branch.name,
        level: nextLevel,
        escalatedTo: target.name,
        reason,
      });
    }

    return NextResponse.json({ escalated: details.length, details });
  } catch (error) {
    console.error('Auto-escalation failed:', error);
    return NextResponse.json(
      { error: 'Auto-escalation check failed' },
      { status: 500 },
    );
  }
}
