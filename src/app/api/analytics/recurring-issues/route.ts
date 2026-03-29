import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';

interface RecurringPattern {
  category: string;
  branchName: string;
  count: number;
  severity: string;
  firstSeen: string;
  lastSeen: string;
  type: 'recurring' | 'systemic';
}

export async function GET() {
  try {
    const user = await getSession();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 1. Fetch all issues from last 90 days
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(ninetyDaysAgo.getDate() - 90);

    const issues = await prisma.issue.findMany({
      where: {
        createdAt: { gte: ninetyDaysAgo },
      },
      select: {
        id: true,
        category: true,
        severity: true,
        createdAt: true,
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
          },
        },
      },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Group by category + branch for recurring detection
    const categoryBranchMap = new Map<
      string,
      {
        category: string;
        branchId: string;
        branchName: string;
        count: number;
        severities: string[];
        firstSeen: Date;
        lastSeen: Date;
      }
    >();

    // Also track category -> set of branch IDs for systemic detection
    const categoryBranchSets = new Map<string, Set<string>>();

    for (const issue of issues) {
      const key = `${issue.category}::${issue.branch.id}`;

      if (!categoryBranchMap.has(key)) {
        categoryBranchMap.set(key, {
          category: issue.category,
          branchId: issue.branch.id,
          branchName: `${issue.branch.code} ${issue.branch.name}`,
          count: 0,
          severities: [],
          firstSeen: issue.createdAt,
          lastSeen: issue.createdAt,
        });
      }

      const entry = categoryBranchMap.get(key)!;
      entry.count++;
      entry.severities.push(issue.severity);
      if (issue.createdAt < entry.firstSeen) entry.firstSeen = issue.createdAt;
      if (issue.createdAt > entry.lastSeen) entry.lastSeen = issue.createdAt;

      // Track branches per category
      if (!categoryBranchSets.has(issue.category)) {
        categoryBranchSets.set(issue.category, new Set());
      }
      categoryBranchSets.get(issue.category)!.add(issue.branch.id);
    }

    // 3. Find recurring patterns: same category at same branch 3+ times
    const recurring: RecurringPattern[] = [];

    for (const entry of Array.from(categoryBranchMap.values())) {
      if (entry.count >= 3) {
        // Determine dominant severity
        const severityCounts: Record<string, number> = {};
        for (const s of entry.severities) {
          severityCounts[s] = (severityCounts[s] || 0) + 1;
        }
        const dominantSeverity = Object.entries(severityCounts).sort(
          (a, b) => b[1] - a[1],
        )[0][0];

        recurring.push({
          category: entry.category,
          branchName: entry.branchName,
          count: entry.count,
          severity: dominantSeverity,
          firstSeen: entry.firstSeen.toISOString(),
          lastSeen: entry.lastSeen.toISOString(),
          type: 'recurring',
        });
      }
    }

    // 4. Find systemic patterns: same category at 5+ different branches
    for (const [category, branchSet] of Array.from(categoryBranchSets.entries())) {
      if (branchSet.size >= 5) {
        // Aggregate across all branches for this category
        let totalCount = 0;
        let earliest = new Date();
        let latest = new Date(0);
        const allSeverities: string[] = [];

        for (const entry of Array.from(categoryBranchMap.values())) {
          if (entry.category === category) {
            totalCount += entry.count;
            allSeverities.push(...entry.severities);
            if (entry.firstSeen < earliest) earliest = entry.firstSeen;
            if (entry.lastSeen > latest) latest = entry.lastSeen;
          }
        }

        const severityCounts: Record<string, number> = {};
        for (const s of allSeverities) {
          severityCounts[s] = (severityCounts[s] || 0) + 1;
        }
        const dominantSeverity = Object.entries(severityCounts).sort(
          (a, b) => b[1] - a[1],
        )[0][0];

        recurring.push({
          category,
          branchName: `${branchSet.size} branches affected`,
          count: totalCount,
          severity: dominantSeverity,
          firstSeen: earliest.toISOString(),
          lastSeen: latest.toISOString(),
          type: 'systemic',
        });
      }
    }

    // Sort: systemic first, then by count descending
    recurring.sort((a, b) => {
      if (a.type !== b.type) return a.type === 'systemic' ? -1 : 1;
      return b.count - a.count;
    });

    return NextResponse.json({ recurring });
  } catch (error) {
    console.error('Failed to fetch recurring issues:', error);
    return NextResponse.json(
      { error: 'Failed to fetch recurring issues' },
      { status: 500 },
    );
  }
}
