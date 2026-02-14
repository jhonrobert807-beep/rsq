import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RideRequestStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { UpdateRideRequestStatusDto } from './dto/update-ride-request-status.dto';

@Injectable()
export class RideRequestsService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly include = {
    user: { select: { id: true, name: true, phone: true } },
    assignedDriver: { select: { id: true, name: true, phone: true } },
    assignedParamedic: { select: { id: true, name: true } },
    ambulance: { select: { id: true, registrationNumber: true, type: true, status: true } },
    hospital: { select: { id: true, name: true } },
  };

  async create(userId: string, dto: CreateRideRequestDto) {
    return this.prisma.rideRequest.create({
      data: {
        userId,
        ...dto,
        status: RideRequestStatus.CREATED,
      },
      include: this.include,
    });
  }

  findAll(filters?: {
    userId?: string;
    status?: RideRequestStatus;
    assignedDriverId?: string;
  }) {
    const where: any = {};
    if (filters?.userId) where.userId = filters.userId;
    if (filters?.status) where.status = filters.status;
    if (filters?.assignedDriverId) where.assignedDriverId = filters.assignedDriverId;

    return this.prisma.rideRequest.findMany({
      where,
      include: this.include,
      orderBy: { requestedAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id },
      include: this.include,
    });
    if (!ride) throw new NotFoundException('Ride request not found');
    return ride;
  }

  async updateStatus(id: string, dto: UpdateRideRequestStatusDto) {
    const ride = await this.findOne(id);

    const data: any = {
      status: dto.status,
      statusUpdatedAt: new Date(),
    };

    if (dto.ambulanceId) data.ambulanceId = dto.ambulanceId;
    if (dto.assignedDriverId) data.assignedDriverId = dto.assignedDriverId;
    if (dto.assignedParamedicId) data.assignedParamedicId = dto.assignedParamedicId;

    if (dto.status === RideRequestStatus.COMPLETED) {
      data.completedAt = new Date();
    }
    if (dto.status === RideRequestStatus.CANCELLED) {
      data.cancelledAt = new Date();
    }

    // If assigning an ambulance, mark it as BUSY
    if (dto.ambulanceId && dto.status === RideRequestStatus.DRIVER_ACCEPTED) {
      await this.prisma.ambulance.update({
        where: { id: dto.ambulanceId },
        data: { status: 'BUSY' },
      });
    }

    // If completing or cancelling, free the ambulance
    if (
      ride.ambulanceId &&
      (dto.status === RideRequestStatus.COMPLETED || dto.status === RideRequestStatus.CANCELLED)
    ) {
      await this.prisma.ambulance.update({
        where: { id: ride.ambulanceId },
        data: { status: 'AVAILABLE' },
      });
    }

    return this.prisma.rideRequest.update({
      where: { id },
      data,
      include: this.include,
    });
  }

  async cancel(id: string, userId: string) {
    const ride = await this.findOne(id);

    const cancellableStatuses: RideRequestStatus[] = [
      RideRequestStatus.CREATED,
      RideRequestStatus.DISPATCHING,
      RideRequestStatus.WAITING_DRIVER_ACCEPT,
    ];

    if (!cancellableStatuses.includes(ride.status)) {
      throw new BadRequestException('Ride cannot be cancelled in current status');
    }

    if (ride.ambulanceId) {
      await this.prisma.ambulance.update({
        where: { id: ride.ambulanceId },
        data: { status: 'AVAILABLE' },
      });
    }

    return this.prisma.rideRequest.update({
      where: { id },
      data: {
        status: RideRequestStatus.CANCELLED,
        cancelledAt: new Date(),
        statusUpdatedAt: new Date(),
      },
      include: this.include,
    });
  }

  async getMyRides(userId: string) {
    return this.prisma.rideRequest.findMany({
      where: { userId },
      include: this.include,
      orderBy: { requestedAt: 'desc' },
    });
  }

  async getDriverRides(driverId: string) {
    return this.prisma.rideRequest.findMany({
      where: { assignedDriverId: driverId },
      include: this.include,
      orderBy: { requestedAt: 'desc' },
    });
  }
}
