import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

interface Anomaly {
  branchId: string;
  branchName: string;
  type: string;
  score: number;
  networkAvg: number;
  details: string;
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all active branches with compliance scores
    const branches = await prisma.branch.findMany({
      where: { status: 'ACTIVE' },
      select: {
        id: true,
        name: true,
        code: true,
        complianceScore: true,
        lastAuditDate: true,
      },
    });

    if (branches.length === 0) {
      return NextResponse.json({ anomalies: [] });
    }

    // 2. Calculate network average and standard deviation
    const scores = branches.map((b) => b.complianceScore);
    const networkAvg = scores.reduce((sum, s) => sum + s, 0) / scores.length;
    const variance =
      scores.reduce((sum, s) => sum + Math.pow(s - networkAvg, 2), 0) /
      scores.length;
    const stdDev = Math.sqrt(variance);

    const threshold = networkAvg - 1.5 * stdDev;
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 3. Fetch open CRITICAL/HIGH issue counts per branch
    const criticalCounts = await prisma.issue.groupBy({
      by: ['branchId'],
      where: {
        status: { in: ['OPEN', 'IN_PROGRESS'] },
        severity: { in: ['CRITICAL', 'HIGH'] },
      },
      _count: { id: true },
    });

    const criticalMap = new Map(
      criticalCounts.map((c) => [c.branchId, c._count.id]),
    );

    // 4. Fetch the two most recent audit scores per branch for score-decline detection
    const recentAudits = await prisma.audit.findMany({
      where: {
        score: { not: null },
        status: { in: ['APPROVED', 'CLOSED'] },
      },
      select: {
        branchId: true,
        score: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Group audits by branch and take the two most recent
    const auditsByBranch = new Map<
      string,
      { score: number; createdAt: Date }[]
    >();
    for (const a of recentAudits) {
      if (!auditsByBranch.has(a.branchId)) {
        auditsByBranch.set(a.branchId, []);
      }
      const list = auditsByBranch.get(a.branchId)!;
      if (list.length < 2) {
        list.push({ score: a.score!, createdAt: a.createdAt });
      }
    }

    // 5. Detect anomalies
    const anomalies: Anomaly[] = [];
    const roundedAvg = Math.round(networkAvg * 10) / 10;

    for (const branch of branches) {
      // Type 1: Score >1.5 std dev below average
      if (branch.complianceScore < threshold && stdDev > 0) {
        anomalies.push({
          branchId: branch.id,
          branchName: `${branch.code} ${branch.name}`,
          type: 'low_score',
          score: branch.complianceScore,
          networkAvg: roundedAvg,
          details: `Score ${branch.complianceScore}% is ${Math.round(networkAvg - branch.complianceScore)} points below network average of ${roundedAvg}%`,
        });
      }

      // Type 2: 3+ open CRITICAL/HIGH issues
      const critCount = criticalMap.get(branch.id) ?? 0;
      if (critCount >= 3) {
        anomalies.push({
          branchId: branch.id,
          branchName: `${branch.code} ${branch.name}`,
          type: 'critical_issues',
          score: branch.complianceScore,
          networkAvg: roundedAvg,
          details: `${critCount} open critical/high severity issues require attention`,
        });
      }

      // Type 3: No audit in the last 30 days
      if (
        !branch.lastAuditDate ||
        branch.lastAuditDate < thirtyDaysAgo
      ) {
        anomalies.push({
          branchId: branch.id,
          branchName: `${branch.code} ${branch.name}`,
          type: 'no_recent_audit',
          score: branch.complianceScore,
          networkAvg: roundedAvg,
          details: branch.lastAuditDate
            ? `Last audit was ${Math.round((Date.now() - branch.lastAuditDate.getTime()) / (1000 * 60 * 60 * 24))} days ago`
            : 'No audit on record',
        });
      }

      // Type 4: Score dropped >5 points from previous audit
      const audits = auditsByBranch.get(branch.id);
      if (audits && audits.length >= 2) {
        const latest = audits[0].score;
        const previous = audits[1].score;
        if (previous - latest > 5) {
          anomalies.push({
            branchId: branch.id,
            branchName: `${branch.code} ${branch.name}`,
            type: 'score_decline',
            score: branch.complianceScore,
            networkAvg: roundedAvg,
            details: `Score dropped ${Math.round(previous - latest)} points (from ${previous}% to ${latest}%)`,
          });
        }
      }
    }

    // Sort by severity: low_score and critical_issues first, then score_decline, then no_recent_audit
    const severityOrder: Record<string, number> = {
      low_score: 0,
      critical_issues: 0,
      score_decline: 1,
      no_recent_audit: 2,
    };
    anomalies.sort(
      (a, b) =>
        (severityOrder[a.type] ?? 3) - (severityOrder[b.type] ?? 3) ||
        a.score - b.score,
    );

    return NextResponse.json({ anomalies });
  } catch (error) {
    console.error('Failed to detect anomalies:', error);
    return NextResponse.json(
      { error: 'Failed to detect anomalies' },
      { status: 500 },
    );
  }
}
