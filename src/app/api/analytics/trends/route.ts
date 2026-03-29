import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { getDataScope } from '@/lib/data-scope';

interface MonthData {
  month: string;
  avgScore: number;
  issueCount: number;
  resolutionRate: number;
  auditCount: number;
}

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const scope = searchParams.get('scope');
    const scopeId = searchParams.get('id');

    // Build scoping filters based on query params or user role
    let auditWhere: Record<string, unknown> = {};
    let issueWhere: Record<string, unknown> = {};

    if (scope === 'branch' && scopeId) {
      auditWhere = { branchId: scopeId };
      issueWhere = { branchId: scopeId };
    } else if (scope === 'region' && scopeId) {
      auditWhere = { branch: { area: { regionId: scopeId } } };
      issueWhere = { branch: { area: { regionId: scopeId } } };
    } else {
      // Apply role-based data scoping
      const auditScope = getDataScope(user, 'audit');
      const issueScope = getDataScope(user, 'issue');
      auditWhere = { ...auditScope };
      issueWhere = { ...issueScope };
    }

    // 1. Calculate 6-month range
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);

    auditWhere.createdAt = { gte: sixMonthsAgo };
    issueWhere.createdAt = { gte: sixMonthsAgo };

    // 2. Fetch audits and issues for the period
    const [audits, issues] = await Promise.all([
      prisma.audit.findMany({
        where: auditWhere,
        select: {
          id: true,
          score: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
      prisma.issue.findMany({
        where: issueWhere,
        select: {
          id: true,
          status: true,
          createdAt: true,
        },
        orderBy: { createdAt: 'asc' },
      }),
    ]);

    // 3. Group by month
    const monthBuckets = new Map<
      string,
      {
        scores: number[];
        auditCount: number;
        totalIssues: number;
        closedIssues: number;
      }
    >();

    // Initialize 6 months
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      monthBuckets.set(key, {
        scores: [],
        auditCount: 0,
        totalIssues: 0,
        closedIssues: 0,
      });
    }

    // Populate audit data
    for (const audit of audits) {
      const key = `${audit.createdAt.getFullYear()}-${String(audit.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthBuckets.get(key);
      if (bucket) {
        bucket.auditCount++;
        if (audit.score !== null) {
          bucket.scores.push(audit.score);
        }
      }
    }

    // Populate issue data
    for (const issue of issues) {
      const key = `${issue.createdAt.getFullYear()}-${String(issue.createdAt.getMonth() + 1).padStart(2, '0')}`;
      const bucket = monthBuckets.get(key);
      if (bucket) {
        bucket.totalIssues++;
        if (issue.status === 'RESOLVED' || issue.status === 'CLOSED') {
          bucket.closedIssues++;
        }
      }
    }

    // 4. Build response
    const monthNames = [
      'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
      'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
    ];

    const months: MonthData[] = [];

    for (const [key, bucket] of Array.from(monthBuckets.entries())) {
      const [year, monthNum] = key.split('-');
      const monthIndex = parseInt(monthNum) - 1;
      const avgScore =
        bucket.scores.length > 0
          ? Math.round(
              (bucket.scores.reduce((s: number, v: number) => s + v, 0) /
                bucket.scores.length) *
                10,
            ) / 10
          : 0;

      const resolutionRate =
        bucket.totalIssues > 0
          ? Math.round(
              (bucket.closedIssues / bucket.totalIssues) * 100 * 10,
            ) / 10
          : 0;

      months.push({
        month: `${monthNames[monthIndex]} ${year}`,
        avgScore,
        issueCount: bucket.totalIssues,
        resolutionRate,
        auditCount: bucket.auditCount,
      });
    }

    return NextResponse.json({ months });
  } catch (error) {
    console.error('Failed to fetch trends:', error);
    return NextResponse.json(
      { error: 'Failed to fetch trends' },
      { status: 500 },
    );
  }
}
