import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateCompletion } from '@/lib/ai';

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const audit = await prisma.audit.findUnique({
    where: { id },
    include: { branch: true, template: true, auditor: true, issues: true },
  });

  if (!audit) return NextResponse.json({ error: 'Audit not found' }, { status: 404 });

  const issuesSummary = audit.issues.length > 0
    ? audit.issues.map(i => `- ${i.severity}: ${i.title}`).join('\n')
    : 'No issues raised';

  const prompt = `Summarize this branch audit in 2-3 concise paragraphs:

Branch: ${audit.branch.name} (${audit.branch.code})
Audit Type: ${audit.template.name} (${audit.template.category})
Auditor: ${audit.auditor.name}
Score: ${audit.score ?? 'Not scored'}%
Status: ${audit.status}
Findings: ${audit.findings || 'No findings recorded'}
Issues Raised (${audit.issues.length}):
${issuesSummary}

Provide: 1) Key findings summary 2) Risk assessment 3) Recommended next steps.`;

  const aiSummary = await generateCompletion(prompt, 'You are an operations audit analyst. Provide concise, actionable audit summaries.');

  if (aiSummary) {
    // Save summary to audit
    await prisma.audit.update({ where: { id }, data: { findings: aiSummary } });
    return NextResponse.json({ summary: aiSummary, source: 'ai' });
  }

  // Fallback: generate basic summary from data
  const score = audit.score ?? 0;
  const riskLevel = score >= 90 ? 'Low' : score >= 70 ? 'Medium' : 'High';
  const fallbackSummary = `Audit Summary for ${audit.branch.name}\n\nThe ${audit.template.name} audit scored ${score}% (Risk: ${riskLevel}). ${audit.issues.length} issue(s) were identified during the inspection. ${audit.findings || 'No additional findings were recorded.'}\n\nRecommendation: ${score >= 90 ? 'Branch is performing well. Continue current practices.' : score >= 70 ? 'Some improvements needed. Address identified issues within the standard SLA window.' : 'Immediate attention required. Schedule follow-up audit within 7 days.'}`;

  await prisma.audit.update({ where: { id }, data: { findings: fallbackSummary } });
  return NextResponse.json({ summary: fallbackSummary, source: 'rules' });
}
