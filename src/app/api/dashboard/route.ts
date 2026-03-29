import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(_request: NextRequest) {
  try {
    // Run all queries in parallel for performance
    const [
      activeBranchesData,
      auditCounts,
      openIssuesCount,
      escalatedItemsCount,
      regionalPerformance,
      recentEscalations,
    ] = await Promise.all([
      // Active branches with compliance scores
      prisma.branch.findMany({
        where: { status: 'ACTIVE' },
        select: { id: true, complianceScore: true },
      }),

      // Audit counts by status
      prisma.audit.groupBy({
        by: ['status'],
        _count: { id: true },
      }),

      // Open issues count
      prisma.issue.count({
        where: {
          status: { in: ['OPEN', 'IN_PROGRESS'] },
        },
      }),

      // Escalated items count (unresolved escalations)
      prisma.escalation.count({
        where: { resolvedAt: null },
      }),

      // Regional performance: average compliance per region
      prisma.region.findMany({
        include: {
          areas: {
            include: {
              branches: {
                where: { status: 'ACTIVE' },
                select: { complianceScore: true },
              },
            },
          },
        },
      }),

      // Recent escalations
      prisma.escalation.findMany({
        where: { resolvedAt: null },
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
