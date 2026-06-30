import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { RegistrationStatus } from '@prisma/client';
import { PrismaService } from '../../common/prisma/prisma.service';
import { CreateParamedicProfileDto } from './dto/create-paramedic-profile.dto';
import { UpdateParamedicProfileDto } from './dto/update-paramedic-profile.dto';

@Injectable()
export class ParamedicProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateParamedicProfileDto) {
    const existing = await this.prisma.paramedicProfile.findUnique({
      where: { userId: dto.userId },
    });
    if (existing) throw new ConflictException('Profile already exists for this user');

    return this.prisma.paramedicProfile.create({
      data: dto,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  findAll(filters?: { status?: RegistrationStatus }) {
    const where: any = {};
    if (filters?.status) where.status = filters.status;

    return this.prisma.paramedicProfile.findMany({
      where,
      include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const profile = await this.prisma.paramedicProfile.findUnique({
      where: { id },
      include: { user: { select: { id: true, name: true, email: true, phone: true, role: true } } },
    });
    if (!profile) throw new NotFoundException('Paramedic profile not found');
    return profile;
  }

  async findByUserId(userId: string) {
    const profile = await this.prisma.paramedicProfile.findUnique({
      where: { userId },
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
    if (!profile) throw new NotFoundException('Paramedic profile not found');
    return profile;
  }

  async update(id: string, dto: UpdateParamedicProfileDto) {
    await this.findOne(id);
    const data: any = { ...dto };
    if (dto.status === RegistrationStatus.VERIFIED) {
      data.verifiedAt = new Date();
    }
    return this.prisma.paramedicProfile.update({
      where: { id },
      data,
      include: { user: { select: { id: true, name: true, email: true, role: true } } },
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.paramedicProfile.delete({ where: { id } });
    return { message: 'Paramedic profile deleted successfully' };
  }
}
