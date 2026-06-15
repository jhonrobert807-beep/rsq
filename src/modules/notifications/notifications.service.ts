import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

@Injectable()
export class NotificationsService {
  constructor(private readonly prisma: PrismaService) {}

  async getPreferences(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        notificationPreferences: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Return default preferences if not set
    const preferences = user.notificationPreferences || {
      rideUpdates: true,
      promotions: false,
      safetyAlerts: true,
      paymentReminders: true,
      systemNotifications: true,
    };

    return {
      userId: user.id,
      preferences,
    };
  }

  async updatePreferences(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const updated = await this.prisma.user.update({
      where: { id: userId },
      data: {
        notificationPreferences: {
          rideUpdates: dto.rideUpdates,
          promotions: dto.promotions,
          safetyAlerts: dto.safetyAlerts,
          paymentReminders: dto.paymentReminders,
          systemNotifications: dto.systemNotifications,
        },
      },
      select: {
        id: true,
        notificationPreferences: true,
      },
    });

    return {
      message: 'Notification preferences updated',
      userId: updated.id,
      preferences: updated.notificationPreferences,
    };
  }

  async getNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Query notifications (would need a notifications table in real implementation)
    // For now, return empty list
    const notifications = [];

    return {
      userId,
      notifications,
      total: notifications.length,
    };
  }

  async markAsRead(notificationId: string) {
    // In real implementation, query notifications table and update isRead
    return {
      message: 'Notification marked as read',
      notificationId,
      isRead: true,
    };
  }

  async deleteNotification(notificationId: string) {
    // In real implementation, delete from notifications table
    return {
      message: 'Notification deleted',
      notificationId,
    };
  }

  async clearAllNotifications(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // In real implementation, delete all notifications for user
    return {
      message: 'All notifications cleared',
      userId,
      cleared: 0,
    };
  }
}
