import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { RideRequestStatus, AmbulanceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DispatchRequestDto } from './dto/dispatch-request.dto';

@Injectable()
export class DispatchService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Haversine formula — calculates distance (km) between two GPS coordinates.
   */
  haversineDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth radius in km
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
   * Find nearest available ambulances sorted by distance from a point.
   */
  async findNearestAmbulances(
    lat: number,
    lng: number,
    options?: { type?: string; radiusKm?: number; limit?: number },
  ) {
    const radiusKm = options?.radiusKm ?? 10;
    const limit = options?.limit ?? 5;

    const ambulances = await this.prisma.ambulance.findMany({
      where: {
        status: AmbulanceStatus.AVAILABLE,
        currentLat: { not: null },
        currentLng: { not: null },
        ...(options?.type ? { type: options.type as any } : {}),
      },
      include: { organization: { select: { id: true, name: true } } },
    });

    const withDistance = ambulances
      .map((amb) => ({
        ...amb,
        distanceKm: this.haversineDistance(lat, lng, amb.currentLat!, amb.currentLng!),
      }))
      .filter((amb) => amb.distanceKm <= radiusKm)
      .sort((a, b) => a.distanceKm - b.distanceKm)
      .slice(0, limit);

    return withDistance;
  }

  /**
   * Auto-dispatch: find nearest ambulance and assign to ride request.
   */
  async dispatch(dto: DispatchRequestDto) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: dto.rideRequestId },
    });

    if (!ride) throw new NotFoundException('Ride request not found');

    if (ride.status !== RideRequestStatus.CREATED && ride.status !== RideRequestStatus.DISPATCHING) {
      throw new BadRequestException('Ride request is not in a dispatchable status');
    }

    // Mark as DISPATCHING
    await this.prisma.rideRequest.update({
      where: { id: ride.id },
      data: { status: RideRequestStatus.DISPATCHING, statusUpdatedAt: new Date() },
    });

    const nearest = await this.findNearestAmbulances(ride.pickupLat, ride.pickupLng, {
      type: dto.ambulanceType ?? ride.ambulanceType,
      radiusKm: dto.radiusKm ?? 10,
      limit: 1,
    });

    if (nearest.length === 0) {
      await this.prisma.rideRequest.update({
        where: { id: ride.id },
        data: { status: RideRequestStatus.FAILED_NO_DRIVER, statusUpdatedAt: new Date() },
      });
      return {
        success: false,
        message: 'No available ambulances found within range',
        rideRequestId: ride.id,
      };
    }

    const ambulance = nearest[0];

    // Assign ambulance and update status
    const updatedRide = await this.prisma.rideRequest.update({
      where: { id: ride.id },
      data: {
        ambulanceId: ambulance.id,
        status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
        etaMinutes: Math.ceil((ambulance.distanceKm / 40) * 60), // ~40 km/h avg speed
        statusUpdatedAt: new Date(),
      },
      include: {
        user: { select: { id: true, name: true, phone: true } },
        ambulance: { select: { id: true, registrationNumber: true, type: true } },
      },
    });

    // Mark ambulance as BUSY
    await this.prisma.ambulance.update({
      where: { id: ambulance.id },
      data: { status: AmbulanceStatus.BUSY },
    });

    return {
      success: true,
      message: 'Ambulance dispatched',
      rideRequest: updatedRide,
      ambulance: {
        id: ambulance.id,
        registrationNumber: ambulance.registrationNumber,
        distanceKm: Math.round(ambulance.distanceKm * 100) / 100,
        etaMinutes: updatedRide.etaMinutes,
      },
    };
  }

  /**
   * Calculate distance between two coordinate pairs (utility endpoint).
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ) {
    const distanceKm = this.haversineDistance(lat1, lng1, lat2, lng2);
    return {
      distanceKm: Math.round(distanceKm * 100) / 100,
      distanceMeters: Math.round(distanceKm * 1000),
    };
  }
}
