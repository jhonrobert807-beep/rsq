import { Injectable, Logger } from '@nestjs/common';
import { Interval } from '@nestjs/schedule';
import { RideRequestStatus, AmbulanceStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { DispatchService } from './dispatch.service';

@Injectable()
export class DispatchTimeoutService {
  private readonly logger = new Logger(DispatchTimeoutService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly dispatchService: DispatchService,
  ) {}

  /**
   * Every 30 seconds, check for WAITING_DRIVER_ACCEPT rides that have expired
   * (statusUpdatedAt > 2 minutes ago) and re-dispatch them.
   */
  @Interval(30_000)
  async handleTimeouts() {
    const twoMinutesAgo = new Date(Date.now() - 2 * 60 * 1000);

    const expiredRides = await this.prisma.rideRequest.findMany({
      where: {
        status: RideRequestStatus.WAITING_DRIVER_ACCEPT,
        statusUpdatedAt: { lt: twoMinutesAgo },
      },
    });

    for (const ride of expiredRides) {
      try {
        this.logger.log(`Ride ${ride.id} timed out — attempting re-dispatch`);

        // Mark pending attempts as TIMEOUT
        await this.prisma.rideRequestAttempt.updateMany({
          where: {
            rideRequestId: ride.id,
            status: 'SENT',
          },
          data: {
            status: 'TIMEOUT',
            respondedAt: new Date(),
            reason: 'NO_RESPONSE',
          },
        });

        // Free the current ambulance
        if (ride.ambulanceId) {
          await this.prisma.ambulance.update({
            where: { id: ride.ambulanceId },
            data: { status: AmbulanceStatus.AVAILABLE },
          });
        }

        // Reset ride to CREATED for re-dispatch
        await this.prisma.rideRequest.update({
          where: { id: ride.id },
          data: {
            status: RideRequestStatus.CREATED,
            ambulanceId: null,
            assignedDriverId: null,
            etaMinutes: null,
            statusUpdatedAt: new Date(),
          },
        });

        // Attempt re-dispatch
        const result = await this.dispatchService.dispatch({
          rideRequestId: ride.id,
          ambulanceType: ride.ambulanceType,
        });

        if (result.success) {
          this.logger.log(`Ride ${ride.id} re-dispatched successfully`);
        } else {
          this.logger.warn(`Ride ${ride.id} re-dispatch failed: ${result.message}`);
        }
      } catch (error) {
        this.logger.error(`Error handling timeout for ride ${ride.id}`, error);
      }
    }
  }
}
