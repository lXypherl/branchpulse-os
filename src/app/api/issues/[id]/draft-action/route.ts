import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateCompletion } from '@/lib/ai';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const issue = await prisma.issue.findUnique({
    where: { id },
    include: { branch: true, audit: { include: { template: true } } },
  });

  if (!issue) return NextResponse.json({ error: 'Issue not found' }, { status: 404 });

  const prompt = `Draft a corrective action plan for this operational issue. Be specific with steps, responsible parties, and timelines.

Branch: ${issue.branch.name} (${issue.branch.code})
Issue: ${issue.title}
Severity: ${issue.severity}
Category: ${issue.category}
Description: ${issue.description}
${issue.audit ? `Related Audit: ${issue.audit.template.name}` : ''}

Provide a numbered list of 3-5 specific corrective actions with timelines.`;

  const aiDraft = await generateCompletion(prompt, 'You are an operations corrective action specialist. Draft specific, actionable corrective action plans.');

  if (aiDraft) {
    return NextResponse.json({ draft: aiDraft, source: 'ai' });
  }

  // Rule-based fallback
  const timelines: Record<string, string> = {
    CRITICAL: '4 hours', HIGH: '24 hours', MEDIUM: '72 hours', LOW: '1 week',
  };
  const timeline = timelines[issue.severity] || '72 hours';

  const fallbackDraft = `Corrective Action Plan for: ${issue.title}

1. Immediate Assessment (within 2 hours): Branch manager to inspect and document the ${issue.category.toLowerCase()} issue at ${issue.branch.name}. Take photographs as evidence.

2. Containment (within ${timeline}): Implement temporary measures to prevent the issue from worsening. Notify affected staff and post any required safety notices.

3. Root Cause Analysis (within 48 hours): Investigate the underlying cause. Review related SOPs and training records. Document findings.

4. Corrective Implementation (within 1 week): Execute the permanent fix. Update relevant SOPs if procedures were inadequate. Retrain staff if needed.

5. Verification (within 2 weeks): Schedule a follow-up inspection to verify the corrective action was effective. Close the issue upon successful verification.`;

  return NextResponse.json({ draft: fallbackDraft, source: 'rules' });
}
