import { Injectable, NotFoundException, ConflictException, BadRequestException } from '@nestjs/common';
import { Role, RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateDriverProfileDto } from './dto/create-driver-profile.dto';
import { UpdateDriverProfileDto } from './dto/update-driver-profile.dto';

@Injectable()
export class DriverProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateDriverProfileDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: dto.userId },
      select: { id: true, role: true },
    });
    if (!user) throw new NotFoundException('User not found');
    if (user.role !== Role.DRIVER) {
      throw new BadRequestException('User must have DRIVER role');
    }

    const existing = await this.prisma.driverProfile.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) throw new ConflictException('Profile already exists for this user');

    return this.prisma.driverProfile.create({
      data: dto,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  findAll(filters?: { status?: RegistrationStatus }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    return this.prisma.driverProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
    });
    if (!profile) throw new NotFoundException('Driver profile not found');
    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.driverProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!profile) throw new NotFoundException('Driver profile not found');
    return profile;
  }

  async update(id: string, dto: UpdateDriverProfileDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.status === RegistrationStatus.VERIFIED) {
      data.verifiedAt = new Date();
    }
    return this.prisma.driverProfile.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.driverProfile.delete({ where: { id } });
    return { message: 'Driver profile deleted successfully' };
  }
}
