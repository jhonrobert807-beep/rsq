import { Controller, Get, Post, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { ChatsService } from './chats.service';
import { ChatsGateway } from './chats.gateway';
import { SendMessageDto } from './dto/send-message.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Chats')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('chats')
export class ChatsController {
  constructor(
    private readonly service: ChatsService,
    private readonly gateway: ChatsGateway,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Send a chat message (REST fallback)' })
  async sendMessage(@CurrentUser() user: any, @Body() dto: SendMessageDto) {
    const chat = await this.service.sendMessage(user.id, dto);
    // Broadcast to all ride participants via WebSocket
    this.gateway.server
      .to(`ride-chat:${dto.rideRequestId}`)
      .emit('newMessage', chat);
    return chat;
  }

  @Get('ride/:rideRequestId')
  @ApiOperation({ summary: 'Get all messages for a ride request' })
  getMessagesByRide(@Param('rideRequestId', ParseUUIDPipe) rideRequestId: string) {
    return this.service.getMessagesByRide(rideRequestId);
  }

  @Get('ride/:rideRequestId/conversation')
  @ApiOperation({ summary: 'Get conversation between two users for a ride' })
  @ApiQuery({ name: 'userId', description: 'Other user ID' })
  getConversation(
    @Param('rideRequestId', ParseUUIDPipe) rideRequestId: string,
    @CurrentUser() user: any,
    @Query('userId') otherUserId: string,
  ) {
    return this.service.getConversation(rideRequestId, user.id, otherUserId);
  }
}
