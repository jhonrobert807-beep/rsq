import { Injectable } from '@nestjs/common';
import { RideRequestStatus, AmbulanceStatus, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';

@Injectable()
export class AdminStatsService {
  constructor(private readonly prisma: PrismaService) {}

  async getStats() {
    const [
      usersByRole,
      ambulancesByStatus,
      ridesByStatus,
      paramedicsByStatus,
      totalRevenue,
    ] = await Promise.all([
      // Users grouped by role
      this.prisma.user.groupBy({
        by: ['role'],
        _count: true,
      }),
      // Ambulances grouped by status
      this.prisma.ambulance.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Rides grouped by status
      this.prisma.rideRequest.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Paramedic profiles grouped by registration status
      this.prisma.paramedicProfile.groupBy({
        by: ['status'],
        _count: true,
      }),
      // Total revenue from completed rides
      this.prisma.rideRequest.aggregate({
        where: { status: RideRequestStatus.COMPLETED, cost: { not: null } },
        _sum: { cost: true },
        _count: true,
      }),
    ]);

    // Transform groupBy results into objects
    const users: Record<string, number> = {};
    let totalUsers = 0;
    for (const group of usersByRole) {
      users[group.role] = group._count;
      totalUsers += group._count;
    }

    const ambulances: Record<string, number> = {};
    let totalAmbulances = 0;
    for (const group of ambulancesByStatus) {
      ambulances[group.status] = group._count;
      totalAmbulances += group._count;
    }

    const rides: Record<string, number> = {};
    let totalRides = 0;
    for (const group of ridesByStatus) {
      rides[group.status] = group._count;
      totalRides += group._count;
    }

    const paramedics: Record<string, number> = {};
    for (const group of paramedicsByStatus) {
      paramedics[group.status] = group._count;
    }

    return {
      users: { total: totalUsers, ...users },
      ambulances: { total: totalAmbulances, ...ambulances },
      rides: {
        total: totalRides,
        ...rides,
        activeRides:
          (rides[RideRequestStatus.DISPATCHING] || 0) +
          (rides[RideRequestStatus.WAITING_DRIVER_ACCEPT] || 0) +
          (rides[RideRequestStatus.DRIVER_ACCEPTED] || 0) +
          (rides[RideRequestStatus.DRIVER_ARRIVED] || 0) +
          (rides[RideRequestStatus.IN_TRIP] || 0),
      },
      paramedics,
      revenue: {
        totalEarned: totalRevenue._sum.cost || 0,
        completedRides: totalRevenue._count || 0,
      },
    };
  }
}
