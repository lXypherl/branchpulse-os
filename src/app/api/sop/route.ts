import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';
import { logAction } from '@/lib/audit-log';

export async function GET(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (category) {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { content: { contains: search, mode: 'insensitive' } },
      ];
    }

    const sops = await prisma.sopDocument.findMany({
      where,
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return NextResponse.json(sops);
  } catch (error) {
    console.error('Failed to fetch SOPs:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOPs' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'create')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, content, version, sections } = body as {
      title?: string;
      description?: string;
      category?: string;
      content?: string;
      version?: string;
      sections?: number;
    };

    if (!title || !category || !content || !version) {
      return NextResponse.json(
        { error: 'Missing required fields: title, category, content, and version are required' },
        { status: 400 }
      );
    }

    const VALID_CATEGORIES = ['Safety', 'Operations', 'Inventory', 'Brand', 'Finance'];
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const sop = await prisma.sopDocument.create({
      data: {
        title,
        description: description ?? null,
        category,
        content,
        version,
        sections: sections ?? 1,
        createdById: user.id,
      },
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, avatarUrl: true },
        },
      },
    });

    // Fire-and-forget: audit log
    logAction(user.id, 'SOP_CREATED', 'SopDocument', sop.id, `${sop.title} [${sop.category}] v${sop.version}`);

    return NextResponse.json(sop, { status: 201 });
  } catch (error) {
    console.error('Failed to create SOP:', error);
    return NextResponse.json(
      { error: 'Failed to create SOP' },
      { status: 500 }
    );
  }
}
