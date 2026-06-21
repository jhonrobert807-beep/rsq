import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { SmsService } from '../../services/sms.service';
import { RideRequestStatus, Role, AmbulanceType, AmbulanceStatus, DispatchAttemptStatus } from '@prisma/client';

const ACTIVE_STATUSES: RideRequestStatus[] = [
  RideRequestStatus.DISPATCHING,
  RideRequestStatus.WAITING_DRIVER_ACCEPT,
  RideRequestStatus.DRIVER_ACCEPTED,
  RideRequestStatus.DRIVER_ARRIVED,
  RideRequestStatus.IN_TRIP,
];

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly smsService: SmsService,
  ) {}

  // ─── Untouched manual admin flow ─────────────────────────────────────────

  async assignRideToParamedic(rideRequestId: string, paramedicId: string) {
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: { assignedParamedic: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideRequestId} not found`);
    }

    const paramedic = await this.prisma.user.findUnique({
      where: { id: paramedicId },
    });

    if (!paramedic) {
      throw new NotFoundException(`Paramedic ${paramedicId} not found`);
    }

    if (paramedic.role !== Role.PARAMEDIC) {
      throw new BadRequestException(`User is not a paramedic`);
    }

    const updatedRide = await this.prisma.rideRequest.update({
      where: { id: rideRequestId },
      data: {
        assignedParamedicId: paramedicId,
        status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
        statusUpdatedAt: new Date(),
      },
      include: {
        user: true,
        assignedParamedic: true,
      },
    });

    return updatedRide;
  }

  // ─── Auto-dispatch ────────────────────────────────────────────────────────

  async dispatch(data: {
    rideRequestId: string;
    ambulanceType: AmbulanceType;
  }): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Auto-dispatch starting for ride: ${data.rideRequestId}`);

      // 1. Load ride — only proceed if still CREATED
      const ride = await this.prisma.rideRequest.findUnique({
        where: { id: data.rideRequestId },
        include: { user: { select: { id: true, phone: true, name: true } } },
      });

      if (!ride) {
        return { success: false, message: 'Ride not found' };
      }

      if (ride.status !== RideRequestStatus.CREATED) {
        this.logger.log(`Ride ${ride.id} is already in status ${ride.status} — skipping dispatch`);
        return { success: true, message: 'Already dispatched' };
      }

      // 2. Find available ambulances of the correct type
      const ambulances = await this.prisma.ambulance.findMany({
        where: {
          status: AmbulanceStatus.AVAILABLE,
          type: data.ambulanceType,
        },
      });

      if (ambulances.length === 0) {
        await this.prisma.rideRequest.update({
          where: { id: ride.id },
          data: {
            status: RideRequestStatus.FAILED_NO_DRIVER,
            statusUpdatedAt: new Date(),
          },
        });
        if (ride.user?.phone) {
          await this.smsService.sendNotification(
            ride.user.phone,
            'No ambulance is available right now. Please try booking again in a few minutes.',
          ).catch(() => {});
        }
        this.logger.warn(`No available ambulances of type ${data.ambulanceType} for ride ${ride.id}`);
        return { success: false, message: 'No available ambulances' };
      }

      // 3. Find drivers not currently on an active ride AND not already attempted for this ride
      const busyDriverIds = await this.prisma.rideRequest.findMany({
        where: { status: { in: ACTIVE_STATUSES }, assignedDriverId: { not: null } },
        select: { assignedDriverId: true },
      }).then(rows => rows.map(r => r.assignedDriverId as string));

      // Exclude drivers who already rejected or timed out on this specific ride
      const previouslyAttemptedDriverIds = await this.prisma.rideRequestAttempt.findMany({
        where: {
          rideRequestId: ride.id,
          status: { in: ['REJECTED', 'TIMEOUT'] },
        },
        select: { driverId: true },
      }).then(rows => rows.map(r => r.driverId));

      const excludedDriverIds = [...new Set([...busyDriverIds, ...previouslyAttemptedDriverIds])];

      const drivers = await this.prisma.user.findMany({
        where: {
          role: Role.DRIVER,
          isActive: true,
          ...(excludedDriverIds.length > 0 ? { id: { notIn: excludedDriverIds } } : {}),
        },
        select: { id: true, phone: true, name: true, locationLat: true, locationLng: true },
      });

      if (drivers.length === 0) {
        await this.prisma.rideRequest.update({
          where: { id: ride.id },
          data: {
            status: RideRequestStatus.FAILED_NO_DRIVER,
            statusUpdatedAt: new Date(),
          },
        });
        if (ride.user?.phone) {
          await this.smsService.sendNotification(
            ride.user.phone,
            'No drivers are available right now. Please try booking again in a few minutes.',
          ).catch(() => {});
        }
        this.logger.warn(`No available drivers for ride ${ride.id}`);
        return { success: false, message: 'No available drivers' };
      }

      // 4. Pick nearest ambulance (sort by distance to pickup if coords available)
      const pickupLat = ride.pickupLat;
      const pickupLng = ride.pickupLng;

      const sortedAmbulances = [...ambulances].sort((a, b) => {
        if (!pickupLat || !pickupLng || !a.currentLat || !b.currentLat) return 0;
        return (
          this.haversineDistance(pickupLat, pickupLng, a.currentLat, a.currentLng!) -
          this.haversineDistance(pickupLat, pickupLng, b.currentLat, b.currentLng!)
        );
      });
      const chosenAmbulance = sortedAmbulances[0];

      // 5. Pick nearest driver
      const sortedDrivers = [...drivers].sort((a, b) => {
        if (!pickupLat || !pickupLng || !a.locationLat || !b.locationLat) return 0;
        return (
          this.haversineDistance(pickupLat, pickupLng, a.locationLat, a.locationLng!) -
          this.haversineDistance(pickupLat, pickupLng, b.locationLat, b.locationLng!)
        );
      });
      const chosenDriver = sortedDrivers[0];

      // 6. For WITH_DOCTOR: find an available paramedic
      let chosenParamedicId: string | null = null;
      if (data.ambulanceType === AmbulanceType.WITH_DOCTOR) {
        const busyParamedicIds = await this.prisma.rideRequest.findMany({
          where: { status: { in: ACTIVE_STATUSES }, assignedParamedicId: { not: null } },
          select: { assignedParamedicId: true },
        }).then(rows => rows.map(r => r.assignedParamedicId as string));

        const paramedic = await this.prisma.user.findFirst({
          where: {
            role: Role.PARAMEDIC,
            isActive: true,
            ...(busyParamedicIds.length > 0 ? { id: { notIn: busyParamedicIds } } : {}),
          },
          select: { id: true },
        });

        if (paramedic) {
          chosenParamedicId = paramedic.id;
        } else {
          this.logger.warn(`No available paramedic for WITH_DOCTOR ride ${ride.id} — dispatching without`);
        }
      }

      // 7. Commit in a transaction
      const expiresAt = new Date(Date.now() + 2 * 60 * 1000);

      await this.prisma.$transaction([
        this.prisma.ambulance.update({
          where: { id: chosenAmbulance.id },
          data: { status: AmbulanceStatus.BUSY },
        }),
        this.prisma.rideRequest.update({
          where: { id: ride.id },
          data: {
            status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
            ambulanceId: chosenAmbulance.id,
            assignedDriverId: chosenDriver.id,
            ...(chosenParamedicId ? { assignedParamedicId: chosenParamedicId } : {}),
            statusUpdatedAt: new Date(),
          },
        }),
        this.prisma.rideRequestAttempt.create({
          data: {
            rideRequestId: ride.id,
            driverId: chosenDriver.id,
            status: DispatchAttemptStatus.SENT,
            sentAt: new Date(),
            expiresAt,
          },
        }),
      ]);

      // 8. Notify driver via SMS
      if (chosenDriver.phone) {
        await this.smsService.sendNotification(
          chosenDriver.phone,
          'New ride assigned to you on ResQLink. Open the app to accept.',
        ).catch(() => {});
      }

      this.logger.log(
        `Ride ${ride.id} dispatched → ambulance ${chosenAmbulance.id}, driver ${chosenDriver.id}`,
      );
      return { success: true, message: 'Dispatched successfully' };

    } catch (error) {
      this.logger.error(`Dispatch failed for ride ${data.rideRequestId}: ${error.message}`);
      return { success: false, message: error.message };
    }
  }

  // ─── Private helpers ──────────────────────────────────────────────────────

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
}
