import { Controller, Patch, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiBearerAuth, ApiOperation } from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { DispatchService } from './dispatch.service';
import { AssignRideDto } from './dto/assign-ride.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Dispatch')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('dispatch')
export class DispatchController {
  constructor(private readonly dispatchService: DispatchService) {}

  @Patch('rides/:id/assign-paramedic')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign paramedic to ride (Admin only)' })
  assignRide(
    @Param('id') rideId: string,
    @Body() dto: AssignRideDto,
  ) {
    return this.dispatchService.assignRideToParamedic(rideId, dto.paramedicId);
  }
}
