import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiBearerAuth,
  ApiOperation,
  ApiQuery,
} from '@nestjs/swagger';
import { Role } from '@prisma/client';
import { UsersService } from './users.service';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@ApiTags('Users')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('users')
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Post()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Create a new user (Admin only)' })
  create(@Body() dto: CreateUserDto) {
    return this.usersService.create(dto);
  }

  @Get()
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all users (Admin only)' })
  @ApiQuery({ name: 'role', enum: Role, required: false })
  @ApiQuery({ name: 'search', required: false })
  findAll(@Query('role') role?: Role, @Query('search') search?: string) {
    return this.usersService.findAll({ role, search });
  }

  @Get(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Get user by ID (Admin only)' })
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update user (Admin can update any user, users can update themselves)' })
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() dto: UpdateUserDto,
  ) {
    return this.usersService.update(id, dto);
  }

  @Delete(':id')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Delete user (Admin only)' })
  remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.remove(id);
  }

  @Patch(':id/pair')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'Assign or remove paired paramedic for a driver (Admin only)' })
  setPairedParamedic(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() body: { pairedParamedicId: string | null },
  ) {
    return this.usersService.setPairedParamedic(id, body.pairedParamedicId);
  }

  @Get('role/drivers')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all drivers with their paired paramedic (Admin only)' })
  getDrivers() {
    return this.usersService.getDrivers();
  }

  @Get('role/paramedics')
  @Roles(Role.ADMIN)
  @ApiOperation({ summary: 'List all paramedics (Admin only)' })
  getParamedics() {
    return this.usersService.getParamedics();
  }
}
