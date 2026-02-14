import { Controller, Get, Post, Patch, Body, Param, Query, ParseUUIDPipe, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role, RideRequestStatus } from '@prisma/client';
import { RideRequestsService } from './ride-requests.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { UpdateRideRequestStatusDto } from './dto/update-ride-request-status.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@ApiTags('Ride Requests')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('ride-requests')
export class RideRequestsController {
  constructor(private readonly service: RideRequestsService) {}

  @Post()
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Create ride request (User)' })
  create(@CurrentUser() user: any, @Body() dto: CreateRideRequestDto) {
    return this.service.create(user.id, dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all ride requests (Admin)' })
  @ApiQuery({ name: 'userId', required: false })
  @ApiQuery({ name: 'status', enum: RideRequestStatus, required: false })
  @ApiQuery({ name: 'assignedDriverId', required: false })
  findAll(
    @Query('userId') userId?: string,
    @Query('status') status?: RideRequestStatus,
    @Query('assignedDriverId') assignedDriverId?: string,
  ) {
    return this.service.findAll({ userId, status, assignedDriverId });
  }

  @Get('my-rides')
  @Roles(Role.USER)
  @ApiOperation({ summary: 'Get my ride requests (User)' })
  getMyRides(@CurrentUser() user: any) {
    return this.service.getMyRides(user.id);
  }

  @Get('driver-rides')
  @Roles(Role.DRIVER)
  @ApiOperation({ summary: 'Get rides assigned to me (Driver)' })
  getDriverRides(@CurrentUser() user: any) {
    return this.service.getDriverRides(user.id);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get ride request by ID' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.service.findOne(id);
  }

  @Patch(':id/status')
  @Roles(Role.ADMIN, Role.DRIVER)
  @ApiOperation({ summary: 'Update ride request status (Admin/Driver)' })
  updateStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateRideRequestStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @Patch(':id/cancel')
  @Roles(Role.USER, Role.ADMIN)
  @ApiOperation({ summary: 'Cancel ride request (User/Admin)' })
  cancel(@Param('id', ParseUUIDPipe) id: string, @CurrentUser() user: any) {
    return this.service.cancel(id, user.id);
  }
}
