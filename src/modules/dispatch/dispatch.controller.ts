import { Controller, Post, Get, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { DispatchRequestDto } from './dto/dispatch-request.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly service: DispatchService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Auto-dispatch nearest ambulance to ride request (Admin)' })
  dispatch(@Body() dto: DispatchRequestDto) {
    return this.service.dispatch(dto);
  }

  @Get('nearest')
  @Roles(Role.ADMIN, Role.DRIVER)
  @ApiOperation({ summary: 'Find nearest available ambulances from a point' })
  @ApiQuery({ name: 'lat', type: Number })
  @ApiQuery({ name: 'lng', type: Number })
  @ApiQuery({ name: 'type', required: false })
  @ApiQuery({ name: 'radiusKm', required: false, type: Number })
  findNearest(
    @Query('lat') lat: string,
    @Query('lng') lng: string,
    @Query('type') type?: string,
    @Query('radiusKm') radiusKm?: string,
  ) {
    return this.service.findNearestAmbulances(parseFloat(lat), parseFloat(lng), {
      type,
      radiusKm: radiusKm ? parseFloat(radiusKm) : undefined,
    });
  }

  @Get('distance')
  @ApiOperation({ summary: 'Calculate distance between two GPS points (Haversine)' })
  @ApiQuery({ name: 'lat1', type: Number })
  @ApiQuery({ name: 'lng1', type: Number })
  @ApiQuery({ name: 'lat2', type: Number })
  @ApiQuery({ name: 'lng2', type: Number })
  calculateDistance(
    @Query('lat1') lat1: string,
    @Query('lng1') lng1: string,
    @Query('lat2') lat2: string,
    @Query('lng2') lng2: string,
  ) {
    return this.service.calculateDistance(
      parseFloat(lat1),
      parseFloat(lng1),
      parseFloat(lat2),
      parseFloat(lng2),
    );
  }
}
