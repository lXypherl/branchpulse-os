import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import prisma from '@/lib/prisma';
import { generateCompletion } from '@/lib/ai';

export async function POST(request: NextRequest) {
  const user = await getSession();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { question } = await request.json();
  if (!question) return NextResponse.json({ error: 'Question required' }, { status: 400 });

  // Search for relevant SOPs
  const sops = await prisma.sopDocument.findMany({
    where: {
      status: 'CURRENT',
      OR: [
        { title: { contains: question, mode: 'insensitive' } },
        { content: { contains: question, mode: 'insensitive' } },
      ],
    },
    select: { id: true, title: true, version: true, content: true, category: true },
    take: 5,
  });

  // If no keyword matches, get all current SOPs (for broader context)
  let contextSops = sops;
  if (sops.length === 0) {
    contextSops = await prisma.sopDocument.findMany({
      where: { status: 'CURRENT' },
      select: { id: true, title: true, version: true, content: true, category: true },
      take: 5,
    });
  }

  if (contextSops.length === 0) {
    return NextResponse.json({
      answer: 'No SOP documents are available to answer your question. Please upload SOPs first.',
      sources: [],
      source: 'none',
    });
  }

  // Build context from SOPs
  const sopContext = contextSops.map(s =>
    `--- ${s.title} (v${s.version}, ${s.category}) ---\n${s.content}`
  ).join('\n\n');

  const prompt = `Answer the following question using ONLY the SOP documents provided below. If the answer is not found in the documents, say "This information is not covered in the current SOPs." Always cite which SOP document your answer comes from.

SOP DOCUMENTS:
${sopContext}

QUESTION: ${question}

Answer:`;

  const aiAnswer = await generateCompletion(prompt, 'You are an SOP assistant. Answer questions using ONLY the provided SOP documents. Always cite your sources.');

  if (aiAnswer) {
    return NextResponse.json({
      answer: aiAnswer,
      sources: contextSops.map(s => ({ id: s.id, title: s.title, version: s.version, category: s.category })),
      source: 'ai',
    });
  }

  // Fallback: return the most relevant SOP content as the "answer"
  const bestMatch = contextSops[0];
  return NextResponse.json({
    answer: `Based on "${bestMatch.title}" (v${bestMatch.version}):\n\n${bestMatch.content.substring(0, 500)}...`,
    sources: contextSops.map(s => ({ id: s.id, title: s.title, version: s.version, category: s.category })),
    source: 'text-search',
  });
}
