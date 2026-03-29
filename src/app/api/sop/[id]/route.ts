import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getSession } from '@/lib/auth';
import { checkPermission } from '@/lib/rbac';

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { id } = await context.params;

    const sop = await prisma.sopDocument.findUnique({
      where: { id },
      include: {
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
    });

    if (!sop) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
    }

    return NextResponse.json(sop);
  } catch (error) {
    console.error('Failed to fetch SOP:', error);
    return NextResponse.json(
      { error: 'Failed to fetch SOP' },
      { status: 500 }
    );
  }
}

export async function PATCH(
  request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'update')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await context.params;
    const body = await request.json();

    const existing = await prisma.sopDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
    }

    const { title, description, category, version, content, status, sections } = body as {
      title?: string;
      description?: string;
      category?: string;
      version?: string;
      content?: string;
      status?: string;
      sections?: number;
    };

    const data: Record<string, unknown> = {};

    if (title !== undefined) data.title = title;
    if (description !== undefined) data.description = description;
    if (category !== undefined) {
      const VALID_CATEGORIES = ['Safety', 'Operations', 'Inventory', 'Brand', 'Finance'];
      if (!VALID_CATEGORIES.includes(category)) {
        return NextResponse.json(
          { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
          { status: 400 }
        );
      }
      data.category = category;
    }
    if (sections !== undefined) data.sections = sections;

    if (status !== undefined) {
      const VALID_STATUSES = ['CURRENT', 'UNDER_REVIEW', 'ARCHIVED'];
      if (!VALID_STATUSES.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status. Must be one of: ${VALID_STATUSES.join(', ')}` },
          { status: 400 }
        );
      }
      data.status = status;
    }

    // Auto-increment version on content change
    if (content !== undefined && content !== existing.content) {
      data.content = content;
      if (version !== undefined) {
        data.version = version;
      } else {
        // Auto-increment: bump the minor version
        const parts = existing.version.split('.');
        const major = parseInt(parts[0]) || 1;
        const minor = (parseInt(parts[1]) || 0) + 1;
        data.version = `${major}.${minor}`;
      }
    } else if (version !== undefined) {
      data.version = version;
    }

    const sop = await prisma.sopDocument.update({
      where: { id },
      data,
      include: {
        createdBy: {
          select: { id: true, name: true, email: true, role: true, avatarUrl: true },
        },
      },
    });

    return NextResponse.json(sop);
  } catch (error) {
    console.error('Failed to update SOP:', error);
    return NextResponse.json(
      { error: 'Failed to update SOP' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  context: RouteContext
) {
  try {
    const user = await getSession();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (!checkPermission(user.role, 'delete')) {
      return NextResponse.json({ error: 'Forbidden', code: 'FORBIDDEN' }, { status: 403 });
    }

    const { id } = await context.params;

    const existing = await prisma.sopDocument.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: 'SOP not found' }, { status: 404 });
    }

    await prisma.sopDocument.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete SOP:', error);
    return NextResponse.json(
      { error: 'Failed to delete SOP' },
      { status: 500 }
    );
  }
}
