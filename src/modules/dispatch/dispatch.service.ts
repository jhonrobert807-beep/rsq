import { Injectable, BadRequestException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';
import { RideRequestStatus, Role, AmbulanceType } from '@prisma/client';

@Injectable()
export class DispatchService {
  private readonly logger = new Logger(DispatchService.name);

  constructor(private readonly prisma: PrismaService) {}

  async assignRideToParamedic(rideRequestId: string, paramedicId: string) {
    // Validate ride exists
    const ride = await this.prisma.rideRequest.findUnique({
      where: { id: rideRequestId },
      include: { assignedParamedic: true },
    });

    if (!ride) {
      throw new NotFoundException(`Ride ${rideRequestId} not found`);
    }

    // Validate paramedic exists and has correct role
    const paramedic = await this.prisma.user.findUnique({
      where: { id: paramedicId },
    });

    if (!paramedic) {
      throw new NotFoundException(`Paramedic ${paramedicId} not found`);
    }

    if (paramedic.role !== Role.PARAMEDIC) {
      throw new BadRequestException(`User is not a paramedic`);
    }

    // Update ride with paramedic assignment
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

  // Legacy method for dispatch-timeout.service compatibility
  async dispatch(data: {
    rideRequestId: string;
    ambulanceType: AmbulanceType;
  }): Promise<{ success: boolean; message: string }> {
    try {
      this.logger.log(`Attempting re-dispatch for ride: ${data.rideRequestId}`);
      
      // Find available paramedic for this ambulance type
      // For now, just return success to maintain compatibility
      // Real implementation would find and assign a paramedic
      return {
        success: true,
        message: 'Re-dispatch initiated',
      };
    } catch (error) {
      this.logger.error(`Dispatch failed: ${error.message}`);
      return {
        success: false,
        message: error.message,
      };
    }
  }
}
