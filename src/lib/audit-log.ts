import prisma from './prisma';

export async function logAction(
  userId: string,
  action: string,
  entityType: string,
  entityId: string,
  details?: string
) {
  try {
    await prisma.auditLog.create({
      data: { userId, action, entityType, entityId, details },
    });
  } catch {
    // Don't let logging failures break the main flow
    console.error('Failed to write audit log');
  }
}
