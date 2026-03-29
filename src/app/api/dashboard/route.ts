import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';

export async function GET(_request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const branchScope = getDataScope(user, 'branch');
    const auditScope = getDataScope(user, 'audit');
    const issueScope = getDataScope(user, 'issue');
    const escalationScope = getDataScope(user, 'escalation');

    // Run all queries in parallel for performance
    const [
      activeBranchesData,
      auditCounts,
      openIssuesCount,
      escalatedItemsCount,
      regionalPerformance,
      recentEscalations,
    ] = await Promise.all([
      // Active branches with compliance scores (scoped)
      prisma.branch.findMany({
        where: { status: 'ACTIVE', ...branchScope },
        select: { id: true, complianceScore: true },
      }),

      // Audit counts by status (scoped)
      prisma.audit.groupBy({
        by: ['status'],
        where: { ...auditScope },
        _count: { id: true },
      }),

      // Open issues count (scoped)
      prisma.issue.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
          ...issueScope,
        },
      }),

      // Escalated items count (unresolved escalations, scoped)
      prisma.escalation.count({
        where: { resolvedAt: null, ...escalationScope },
      }),

      // Regional performance: average compliance per region (scoped)
      prisma.region.findMany({
        include: {
          areas: {
            include: {
              branches: {
                where: { status: 'ACTIVE', ...branchScope },
                select: { complianceScore: true },
              },
            },
          },
        },
      }),

      // Recent escalations (scoped)
      prisma.escalation.findMany({
        where: { resolvedAt: null, ...escalationScope },
        include: {
          issue: {
            select: {
              id: true,
              title: true,
              severity: true,
              status: true,
              branch: {
                select: { id: true, name: true, code: true },
              },
            },
          },
          escalatedTo: {
            select: { id: true, name: true, email: true, role: true },
          },
        },
        orderBy: { triggeredAt: 'desc' },
        take: 10,
      }),
    ]);

    // Calculate average compliance score across all active branches
    const activeBranches = activeBranchesData.length;
    const complianceScore =
      activeBranches > 0
        ? Math.round(
            (activeBranchesData.reduce(
              (sum, b) => sum + b.complianceScore,
              0
            ) /
              activeBranches) *
              10
          ) / 10
        : 0;

    // Parse audit counts
    const auditCountMap = new Map(
      auditCounts.map((ac) => [ac.status, ac._count.id])
    );

    const activeAudits =
      (auditCountMap.get('DRAFT') ?? 0) +
      (auditCountMap.get('SUBMITTED') ?? 0) +
      (auditCountMap.get('UNDER_REVIEW') ?? 0) +
      (auditCountMap.get('APPROVED') ?? 0) +
      (auditCountMap.get('RETURNED') ?? 0) +
      (auditCountMap.get('CLOSED') ?? 0);

    const pendingAudits =
      (auditCountMap.get('SUBMITTED') ?? 0) +
      (auditCountMap.get('UNDER_REVIEW') ?? 0);

    // Build regional performance summary
    const regionalPerformanceSummary = regionalPerformance.map((region) => {
      const branches = region.areas.flatMap((area) => area.branches);
      const branchCount = branches.length;
      const avgScore =
        branchCount > 0
          ? Math.round(
              (branches.reduce((sum, b) => sum + b.complianceScore, 0) /
                branchCount) *
                10
            ) / 10
          : 0;

      return {
        regionId: region.id,
        regionName: region.name,
        branchCount,
        averageComplianceScore: avgScore,
      };
    });

    const dashboard = {
      complianceScore,
      activeBranches,
      activeAudits,
      pendingAudits,
      openIssues: openIssuesCount,
      escalatedItems: escalatedItemsCount,
      regionalPerformance: regionalPerformanceSummary,
      recentEscalations,
    };

    return NextResponse.json(dashboard);
  } catch (error) {
    console.error('Failed to fetch dashboard data:', error);
    return NextResponse.json(
      { error: 'Failed to fetch dashboard data' },
      { status: 500 }
    );
  }
}
