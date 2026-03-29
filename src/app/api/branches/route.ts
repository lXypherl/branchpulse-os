import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const region = searchParams.get('region');
    const search = searchParams.get('search');

    const where: Record<string, unknown> = {};

    if (status) {
      where.status = status;
    }

    if (region) {
      where.area = {
        regionId: region,
      };
    }

    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { code: { contains: search, mode: 'insensitive' } },
        { address: { contains: search, mode: 'insensitive' } },
      ];
    }

    const branches = await prisma.branch.findMany({
      where,
      include: {
        area: {
          include: {
            region: true,
          },
        },
        manager: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
            avatarUrl: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(branches);
  } catch (error) {
    console.error('Failed to fetch branches:', error);
    return NextResponse.json(
      { error: 'Failed to fetch branches' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { name, code, areaId, address, managerId, operatingHours, status } =
      body as {
        name?: string;
        code?: string;
        areaId?: string;
        address?: string;
        managerId?: string;
        operatingHours?: string;
        status?: string;
      };

    if (!name || !code || !areaId) {
      return NextResponse.json(
        { error: 'Missing required fields: name, code, and areaId are required' },
        { status: 400 }
      );
    }

    const existingBranch = await prisma.branch.findUnique({
      where: { code },
    });

    if (existingBranch) {
      return NextResponse.json(
        { error: `Branch with code "${code}" already exists` },
        { status: 400 }
      );
    }

    const area = await prisma.area.findUnique({ where: { id: areaId } });
    if (!area) {
      return NextResponse.json(
        { error: `Area with id "${areaId}" not found` },
        { status: 400 }
      );
    }

    const branch = await prisma.branch.create({
      data: {
        name,
        code,
        areaId,
        address: address ?? '',
        managerId: managerId ?? null,
        operatingHours: operatingHours ?? null,
        status: (status as any) ?? undefined,
      },
      include: {
        area: {
          include: { region: true },
        },
        manager: {
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

    return NextResponse.json(branch, { status: 201 });
  } catch (error) {
    console.error('Failed to create branch:', error);
    return NextResponse.json(
      { error: 'Failed to create branch' },
      { status: 500 }
    );
  }
}
