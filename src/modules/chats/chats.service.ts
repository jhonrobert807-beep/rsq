import { Injectable } from '@nestjs/common';
import { ChatMessageType } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SendMessageDto } from './dto/send-message.dto';

@Injectable()
export class ChatsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    sender: { select: { id: true, name: true, role: true } },
    receiver: { select: { id: true, name: true, role: true } },
  };

  async sendMessage(senderId: string, dto: SendMessageDto) {
    return this.prisma.chat.create({
      data: {
        rideRequestId: dto.rideRequestId,
        senderId,
        receiverId: dto.receiverId ?? senderId,
        message: dto.message,
        messageType: dto.messageType ?? ChatMessageType.TEXT,
      },
      include: this.include,
    });
  }

  async getMessagesByRide(rideRequestId: string) {
    return this.prisma.chat.findMany({
      where: { rideRequestId },
      include: this.include,
      orderBy: { sentAt: 'asc' },
    });
  }

  async getConversation(rideRequestId: string, userId1: string, userId2: string) {
    return this.prisma.chat.findMany({
      where: {
        rideRequestId,
        OR: [
          { senderId: userId1, receiverId: userId2 },
          { senderId: userId2, receiverId: userId1 },
        ],
      },
      include: this.include,
      orderBy: { sentAt: 'asc' },
    });
  }
}
