import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { ChatsService } from './chats.service';
import { PrismaService } from '../../common/prisma/prisma.service';

@WebSocketGateway({
  namespace: '/chat',
  cors: { origin: '*' },
})
export class ChatsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  constructor(
    private readonly chatsService: ChatsService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake?.auth?.token || client.handshake?.headers?.authorization?.split(' ')[1];
      if (!token) {
        client.disconnect();
        return;
      }
      const user = this.jwtService.verify(token, {
        secret: this.configService.getOrThrow<string>('JWT_ACCESS_SECRET'),
      });
      // JWT payload uses 'sub' as the user id field
      (client as any).user = { ...user, id: user.sub };
      console.log(`Chat client connected: ${client.id} (user: ${user.sub})`);
    } catch (error) {
      console.log(`Chat auth failed for ${client.id}:`, error?.message || error);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`Chat client disconnected: ${client.id}`);
  }

  @SubscribeMessage('joinRide')
  async handleJoinRide(
    @MessageBody() data: { rideRequestId: string },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user) throw new WsException('Unauthorized');

      // Verify user is part of this ride
      const ride = await this.prisma.rideRequest.findUnique({
        where: { id: data.rideRequestId },
        select: { userId: true, assignedParamedicId: true, assignedDriverId: true },
      });

      if (!ride) throw new WsException('Ride not found');

      const isUserInRide =
        ride.userId === user.id ||
        ride.assignedParamedicId === user.id ||
        ride.assignedDriverId === user.id;

      if (!isUserInRide) throw new WsException('Forbidden: Not part of this ride');

      client.join(`ride-chat:${data.rideRequestId}`);
      return { event: 'joinedRide', data: { rideRequestId: data.rideRequestId } };
    } catch (error) {
      throw new WsException(error.message || 'Failed to join ride');
    }
  }

  @SubscribeMessage('sendMessage')
  async handleMessage(
    @MessageBody()
    data: {
      receiverId: string;
      rideRequestId: string;
      message: string;
      messageType?: string;
    },
    @ConnectedSocket() client: Socket,
  ) {
    try {
      const user = (client as any).user;
      if (!user) throw new WsException('Unauthorized');

      if (!data.message?.trim()) throw new WsException('Message cannot be empty');

      // Verify both users are in the same ride
      const ride = await this.prisma.rideRequest.findUnique({
        where: { id: data.rideRequestId },
        select: { userId: true, assignedParamedicId: true, assignedDriverId: true },
      });

      if (!ride) throw new WsException('Ride not found');

      const senderInRide =
        ride.userId === user.id ||
        ride.assignedParamedicId === user.id ||
        ride.assignedDriverId === user.id;

      const receiverInRide =
        ride.userId === data.receiverId ||
        ride.assignedParamedicId === data.receiverId ||
        ride.assignedDriverId === data.receiverId;

      if (!senderInRide || !receiverInRide) {
        throw new WsException('Forbidden: Users not in same ride');
      }

      const chat = await this.chatsService.sendMessage(user.id, {
        rideRequestId: data.rideRequestId,
        receiverId: data.receiverId,
        message: data.message,
        messageType: data.messageType as any,
      });

      // Broadcast to all users in the ride chat room
      this.server
        .to(`ride-chat:${data.rideRequestId}`)
        .emit('newMessage', chat);

      return { event: 'messageSent', data: chat };
    } catch (error) {
      throw new WsException(error.message || 'Failed to send message');
    }
  }
}
