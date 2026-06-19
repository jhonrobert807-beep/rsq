import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../common/prisma/prisma.service';

interface LocationResult {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  type: string;
  distance?: number;
}

@Injectable()
export class LocationsService {
  constructor(private prisma: PrismaService) {}

  async searchLocations(
    query: string,
    userLat?: number,
    userLng?: number,
  ): Promise<LocationResult[]> {
    // Fallback static locations if database query returns nothing
    // These are common hospitals in Karachi
    const staticLocations = [
      {
        id: 'loc-001',
        name: 'Shifa International Hospital',
        address: 'Plot B-5, Scheme 5, Clifton',
        latitude: 24.8126,
        longitude: 67.0354,
        type: 'hospital',
      },
      {
        id: 'loc-002',
        name: 'Aga Khan Hospital',
        address: 'Aga Khan III Road, Karachi',
        latitude: 24.8084,
        longitude: 67.0295,
        type: 'hospital',
      },
      {
        id: 'loc-003',
        name: 'Civil Hospital Karachi',
        address: 'Block 7, Clifton, Karachi',
        latitude: 24.8089,
        longitude: 67.0215,
        type: 'hospital',
      },
      {
        id: 'loc-004',
        name: 'JPMC (Jinnah Postgraduate Medical Centre)',
        address: 'New Town, Karachi',
        latitude: 24.9007,
        longitude: 67.0934,
        type: 'hospital',
      },
      {
        id: 'loc-005',
        name: 'United Hospital',
        address: 'Abdulrahman Patel Street, Karachi',
        latitude: 24.8595,
        longitude: 67.0189,
        type: 'hospital',
      },
    ];

    // If no query provided, return all locations
    if (!query || query.trim() === '') {
      return this.calculateDistances(staticLocations, userLat, userLng);
    }

    // Filter locations by query (case-insensitive)
    const queryLower = query.toLowerCase();
    const filtered = staticLocations.filter(
      (loc) =>
        loc.name.toLowerCase().includes(queryLower) ||
        loc.address.toLowerCase().includes(queryLower),
    );

    return this.calculateDistances(filtered, userLat, userLng);
  }

  private calculateDistances(
    locations: LocationResult[],
    userLat?: number,
    userLng?: number,
  ): LocationResult[] {
    // If user location provided, calculate distance and sort by distance
    if (userLat && userLng) {
      return locations
        .map((loc) => ({
          ...loc,
          distance: this.calculateDistance(userLat, userLng, loc.latitude, loc.longitude),
        }))
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, 10); // Return top 10 closest
    }

    // Otherwise return first 10
    return locations.slice(0, 10);
  }

  private calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number,
  ): number {
    const R = 6371; // Earth's radius in km
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLng = ((lng2 - lng1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }
}
