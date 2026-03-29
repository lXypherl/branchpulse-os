import prisma from './prisma';

export async function createNotification(
  userId: string,
  title: string,
  message: string,
  type: string
) {
  try {
    await prisma.notification.create({
      data: { userId, title, message, type },
    });
  } catch {
    console.error('Failed to create notification');
  }
}

// Notify multiple users
export async function notifyUsers(
  userIds: string[],
  title: string,
  message: string,
  type: string
) {
  try {
    await prisma.notification.createMany({
      data: userIds.map(userId => ({ userId, title, message, type })),
    });
  } catch {
    console.error('Failed to create notifications');
  }
}
