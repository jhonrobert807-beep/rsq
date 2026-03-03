import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RideRequestStatus, AmbulanceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateRideRequestDto } from './dto/create-ride-request.dto';
import { UpdateRideRequestStatusDto } from './dto/update-ride-request-status.dto';
import { UpdatePaymentDto } from './dto/update-payment.dto';

// Fare constants
const FARE_BASE_BASIC = 200; // Base fare for BASIC ambulance (PKR)
const FARE_BASE_WITH_DOCTOR = 500; // Base fare for WITH_DOCTOR ambulance
const FARE_PER_KM_BASIC = 50; // Per-km rate for BASIC
const FARE_PER_KM_WITH_DOCTOR = 100; // Per-km rate for WITH_DOCTOR

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

  /**
   * Haversine formula to calculate distance between two GPS points in km.
   */
  private haversineDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371;
    const toRad = (deg: number) => (deg * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a =
      Math.sin(dLat / 2) ** 2 +
      Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  /**
   * Calculate fare based on distance and ambulance type.
   */
  calculateFare(distanceKm: number, ambulanceType: string): number {
    const isWithDoctor = ambulanceType === 'WITH_DOCTOR';
    const baseFare = isWithDoctor ? FARE_BASE_WITH_DOCTOR : FARE_BASE_BASIC;
    const perKm = isWithDoctor ? FARE_PER_KM_WITH_DOCTOR : FARE_PER_KM_BASIC;
    return Math.round((baseFare + distanceKm * perKm) * 100) / 100;
  }

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

      // Auto-calculate fare on completion
      if (ride.pickupLat && ride.pickupLng && ride.destinationLat && ride.destinationLng) {
        const distanceKm = this.haversineDistance(
          ride.pickupLat, ride.pickupLng,
          ride.destinationLat, ride.destinationLng,
        );
        data.distanceKm = Math.round(distanceKm * 100) / 100;
        data.cost = this.calculateFare(distanceKm, ride.ambulanceType);
      }
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

  /**
   * Driver accepts a ride request.
   */
  async acceptRide(id: string, driverId: string) {
    const ride = await this.findOne(id);

    if (ride.status !== RideRequestStatus.WAITING_DRIVER_ACCEPT) {
      throw new BadRequestException('Ride is not in WAITING_DRIVER_ACCEPT status');
    }

    // Update the dispatch attempt record
    await this.prisma.rideRequestAttempt.updateMany({
      where: {
        rideRequestId: id,
        driverId,
        status: 'SENT',
      },
      data: {
        status: 'ACCEPTED',
        respondedAt: new Date(),
      },
    });

    return this.prisma.rideRequest.update({
      where: { id },
      data: {
        status: RideRequestStatus.DRIVER_ACCEPTED,
        assignedDriverId: driverId,
        statusUpdatedAt: new Date(),
      },
      include: this.include,
    });
  }

  /**
   * Driver rejects a ride request — frees ambulance and marks attempt as REJECTED.
   */
  async rejectRide(id: string, driverId: string) {
    const ride = await this.findOne(id);

    if (ride.status !== RideRequestStatus.WAITING_DRIVER_ACCEPT) {
      throw new BadRequestException('Ride is not in WAITING_DRIVER_ACCEPT status');
    }

    // Mark the attempt as REJECTED
    await this.prisma.rideRequestAttempt.updateMany({
      where: {
        rideRequestId: id,
        driverId,
        status: 'SENT',
      },
      data: {
        status: 'REJECTED',
        respondedAt: new Date(),
        reason: 'REJECTED',
      },
    });

    // Free the current ambulance
    if (ride.ambulanceId) {
      await this.prisma.ambulance.update({
        where: { id: ride.ambulanceId },
        data: { status: AmbulanceStatus.AVAILABLE },
      });
    }

    // Reset ride to CREATED so it can be re-dispatched
    return this.prisma.rideRequest.update({
      where: { id },
      data: {
        status: RideRequestStatus.CREATED,
        ambulanceId: null,
        assignedDriverId: null,
        etaMinutes: null,
        statusUpdatedAt: new Date(),
      },
      include: this.include,
    });
  }

  /**
   * User rates a completed ride (1-5).
   */
  async rateRide(id: string, userId: string, rating: number) {
    const ride = await this.findOne(id);

    if (ride.status !== RideRequestStatus.COMPLETED) {
      throw new BadRequestException('Can only rate completed rides');
    }
    if (ride.userId !== userId) {
      throw new BadRequestException('Only the ride requester can rate');
    }
    if (ride.userRating) {
      throw new BadRequestException('Ride has already been rated');
    }

    return this.prisma.rideRequest.update({
      where: { id },
      data: { userRating: rating },
      include: this.include,
    });
  }

  /**
   * Update payment status and method for a ride.
   */
  async updatePayment(id: string, dto: UpdatePaymentDto) {
    await this.findOne(id);

    return this.prisma.rideRequest.update({
      where: { id },
      data: {
        paymentStatus: dto.paymentStatus,
        ...(dto.paymentMethod ? { paymentMethod: dto.paymentMethod } : {}),
      },
      include: this.include,
    });
  }

  /**
   * Admin reassigns a ride to a different ambulance.
   */
  async reassign(id: string, newAmbulanceId: string) {
    const ride = await this.findOne(id);

    const reassignableStatuses: RideRequestStatus[] = [
      RideRequestStatus.WAITING_DRIVER_ACCEPT,
      RideRequestStatus.DRIVER_ACCEPTED,
      RideRequestStatus.DISPATCHING,
    ];

    if (!reassignableStatuses.includes(ride.status)) {
      throw new BadRequestException('Ride cannot be reassigned in current status');
    }

    // Verify new ambulance exists and is available
    const newAmbulance = await this.prisma.ambulance.findUnique({
      where: { id: newAmbulanceId },
    });
    if (!newAmbulance) throw new NotFoundException('Ambulance not found');
    if (newAmbulance.status !== AmbulanceStatus.AVAILABLE) {
      throw new BadRequestException('Selected ambulance is not available');
    }

    // Free old ambulance
    if (ride.ambulanceId) {
      await this.prisma.ambulance.update({
        where: { id: ride.ambulanceId },
        data: { status: AmbulanceStatus.AVAILABLE },
      });
    }

    // Mark new ambulance as busy
    await this.prisma.ambulance.update({
      where: { id: newAmbulanceId },
      data: { status: AmbulanceStatus.BUSY },
    });

    return this.prisma.rideRequest.update({
      where: { id },
      data: {
        ambulanceId: newAmbulanceId,
        status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
        assignedDriverId: null,
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
