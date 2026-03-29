import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const branchId = searchParams.get('branchId');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (branchId) {
      where.branchId = branchId;
    }

    const stockRequests = await prisma.stockRequest.findMany({
      where,
      include: {
        branch: {
          select: {
            id: true,
            name: true,
            code: true,
            status: true,
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
            email: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(stockRequests);
  } catch (error) {
    console.error('Failed to fetch stock requests:', error);
    return NextResponse.json(
      { error: 'Failed to fetch stock requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { branchId, requestedById, items, notes, status } = body as {
      branchId?: string;
      requestedById?: string;
      items?: unknown;
      notes?: string;
      status?: string;
    };

    if (!branchId || !requestedById) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: branchId and requestedById are required',
        },
        { status: 400 }
      );
    }

    if (!items) {
      return NextResponse.json(
        { error: 'Missing required field: items' },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.findUnique({ where: { id: branchId } });
    if (!branch) {
      return NextResponse.json(
        { error: `Branch with id "${branchId}" not found` },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: requestedById },
    });
    if (!user) {
      return NextResponse.json(
        { error: `User with id "${requestedById}" not found` },
        { status: 400 }
      );
    }

    const stockRequest = await prisma.stockRequest.create({
      data: {
        branchId,
        requestedById,
        items: items as object,
        notes: notes ?? null,
        status: (status as any) ?? undefined,
      },
      include: {
        branch: { select: { id: true, name: true, code: true } },
        requestedBy: { select: { id: true, name: true, email: true } },
      },
    });

    return NextResponse.json(stockRequest, { status: 201 });
  } catch (error) {
    console.error('Failed to create stock request:', error);
    return NextResponse.json(
      { error: 'Failed to create stock request' },
      { status: 500 }
    );
  }
}
